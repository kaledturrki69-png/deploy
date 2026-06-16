import random
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import (
    QuizTemplate, QuizCategory, Question, QuestionChoice, QuizInstance
)
from .serializers import (
    QuizTemplateSerializer, QuizCategorySerializer, QuestionSerializer,
    QuestionChoiceSerializer, QuizInstanceSerializer
)


class QuizTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = QuizTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = QuizTemplate.objects.filter(company=self.request.user.company)
        skill_id = self.request.query_params.get('skill')
        if skill_id:
            qs = qs.filter(skill_id=skill_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.company)


class QuizCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = QuizCategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = QuizCategory.objects.filter(template__company=self.request.user.company)
        template_id = self.request.query_params.get('template')
        if template_id:
            qs = qs.filter(template_id=template_id)
        return qs


class QuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Question.objects.filter(template__company=self.request.user.company)


class QuestionChoiceViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionChoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return QuestionChoice.objects.filter(question__template__company=self.request.user.company)


class QuizInstanceViewSet(viewsets.ModelViewSet):
    serializer_class = QuizInstanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return QuizInstance.objects.filter(template__company=self.request.user.company)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        instance = self.get_object()
        if instance.is_completed:
            return Response({'detail': 'Quiz already completed.'}, status=400)
        instance.is_completed = True
        instance.save(update_fields=['is_completed'])
        return Response({'status': 'completed', 'score': instance.score})


class PublicQuizViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def generate_quiz(self, request):
        """
        Create a real QuizInstance from a QuizTemplate.
        Randomly picks N questions respecting category_mix_mode.
        """
        template_id = request.data.get('template_id')
        candidate_id = request.data.get('candidate_id')
        recruiter_id = request.data.get('recruiter_id')
        question_count = int(request.data.get('question_count', 0))

        if not template_id:
            return Response({'detail': 'template_id is required.'}, status=400)
        if not candidate_id:
            return Response({'detail': 'candidate_id is required.'}, status=400)
        if not recruiter_id:
            return Response({'detail': 'recruiter_id is required.'}, status=400)

        try:
            template = QuizTemplate.objects.get(id=template_id)
        except QuizTemplate.DoesNotExist:
            return Response({'detail': 'Template not found.'}, status=404)

        from apps.candidates.models import Candidate
        from django.conf import settings
        User = __import__('django.contrib.auth', fromlist=['get_user_model']).get_user_model()

        try:
            candidate = Candidate.objects.get(id=candidate_id)
        except Candidate.DoesNotExist:
            return Response({'detail': 'Candidate not found.'}, status=404)

        try:
            recruiter = User.objects.get(id=recruiter_id)
        except User.DoesNotExist:
            return Response({'detail': 'Recruiter not found.'}, status=404)

        # Determine question count
        n = question_count if question_count > 0 else template.default_question_count

        # Select questions based on mix mode
        all_questions = list(
            Question.objects.filter(template=template, is_active=True)
            .prefetch_related('choices')
        )

        if not all_questions:
            return Response({'detail': 'No active questions available in this template.'}, status=400)

        if template.category_mix_mode == 'uniform':
            # Distribute evenly across categories
            categories = list(QuizCategory.objects.filter(template=template))
            if categories:
                per_cat = max(1, n // len(categories))
                selected = []
                for cat in categories:
                    cat_qs = [q for q in all_questions if q.category_id == cat.id]
                    random.shuffle(cat_qs)
                    selected.extend(cat_qs[:per_cat])
                # Fill remaining slots
                used_ids = {q.id for q in selected}
                remaining = [q for q in all_questions if q.id not in used_ids]
                random.shuffle(remaining)
                selected.extend(remaining[:max(0, n - len(selected))])
                selected = selected[:n]
            else:
                random.shuffle(all_questions)
                selected = all_questions[:n]
        else:
            random.shuffle(all_questions)
            selected = all_questions[:n]

        instance = QuizInstance.objects.create(
            template=template,
            candidate=candidate,
            recruiter=recruiter,
            language_code=template.language_code,
            question_count=len(selected),
        )

        # Store selected question IDs on the instance via a related model or JSON
        # Using a simple approach: store them ordered by their IDs
        instance._selected_questions = selected  # in-memory only for response

        # Return the quiz_id and question list
        questions_data = []
        for q in selected:
            choices = [
                {'id': c.id, 'text': c.text}
                for c in q.choices.all()
            ]
            questions_data.append({
                'id': q.id,
                'text': q.text,
                'type': q.type,
                'difficulty': q.difficulty,
                'max_score': q.max_score,
                'choices': choices,
            })

        return Response({
            'quiz_id': instance.id,
            'template_name': template.name,
            'question_count': len(selected),
            'questions': questions_data,
            'message': 'Quiz generated successfully',
        })

    @action(detail=True, methods=['get'])
    def quiz(self, request, pk=None):
        """Return the QuizInstance with its template questions."""
        try:
            instance = QuizInstance.objects.select_related('template', 'candidate').get(id=pk)
        except QuizInstance.DoesNotExist:
            return Response({'detail': 'Quiz not found.'}, status=404)

        questions = list(
            Question.objects.filter(template=instance.template, is_active=True)
            .prefetch_related('choices')
            .order_by('order', 'id')[:instance.question_count]
        )

        questions_data = []
        for q in questions:
            choices = [{'id': c.id, 'text': c.text} for c in q.choices.all()]
            questions_data.append({
                'id': q.id,
                'text': q.text,
                'type': q.type,
                'difficulty': q.difficulty,
                'max_score': q.max_score,
                'choices': choices,
            })

        return Response({
            'quiz_id': instance.id,
            'template': instance.template.name,
            'candidate_id': instance.candidate.id,
            'is_completed': instance.is_completed,
            'score': instance.score if instance.is_completed else None,
            'questions': questions_data,
        })

    @action(detail=True, methods=['post'], url_path='submit')
    def submit(self, request, pk=None):
        """
        Accept candidate answers, score them, mark instance as completed.

        Expects: {"answers": [{"question_id": N, "choice_ids": [M], "value": "..."}]}
        """
        try:
            instance = QuizInstance.objects.get(id=pk)
        except QuizInstance.DoesNotExist:
            return Response({'detail': 'Quiz not found.'}, status=404)

        if instance.is_completed:
            return Response({'detail': 'Quiz already submitted.'}, status=400)

        answers = request.data.get('answers', [])
        if not answers:
            return Response({'detail': 'No answers provided.'}, status=400)

        total_score = 0.0
        max_possible = 0.0

        for answer in answers:
            question_id = answer.get('question_id')
            choice_ids = answer.get('choice_ids', [])
            value = answer.get('value', '')

            try:
                question = Question.objects.prefetch_related('choices').get(
                    id=question_id, template=instance.template
                )
            except Question.DoesNotExist:
                continue

            max_possible += question.max_score

            q_type = question.type

            if q_type in ('single_choice', 'multi_choice', 'yesno'):
                # Score based on correct choices
                correct_choices = set(
                    question.choices.filter(is_correct=True).values_list('id', flat=True)
                )
                selected = set(choice_ids)
                if q_type == 'single_choice' or q_type == 'yesno':
                    if selected == correct_choices:
                        total_score += question.max_score
                else:  # multi_choice: partial credit via weights
                    weighted_score = 0.0
                    for c in question.choices.all():
                        if c.id in selected and c.is_correct:
                            weighted_score += c.weight
                        elif c.id in selected and not c.is_correct:
                            weighted_score -= c.weight  # penalty for wrong choices
                    total_score += max(0.0, min(question.max_score, weighted_score))

            elif q_type in ('text', 'numeric', 'rating'):
                # Compare against expected_value
                expected = (question.expected_value or '').strip().lower()
                given = str(value).strip().lower()
                if expected and given == expected:
                    total_score += question.max_score

        # Normalize to percentage
        final_score = round((total_score / max_possible * 100), 2) if max_possible > 0 else 0.0

        instance.score = final_score
        instance.is_completed = True
        instance.save(update_fields=['score', 'is_completed'])

        return Response({
            'status': 'submitted',
            'quiz_id': instance.id,
            'score': final_score,
            'total_score_raw': round(total_score, 4),
            'max_possible': round(max_possible, 4),
        })
