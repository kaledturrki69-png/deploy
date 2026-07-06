import json
import re
import os
from pathlib import Path
from json import JSONDecodeError
from django.conf import settings
from openai import OpenAI
from .CandidateProfile import CandidateProfile
DEFAULT_SCHEMA_VERSION = "1"


def load_resume_schema(version: str = DEFAULT_SCHEMA_VERSION) -> dict:
    """
    Load the JSON schema definition for the resume parser.
    """
    schema_path = Path(__file__).resolve().parent.parent / "schemas" / f"schema{version}.json"
    if not schema_path.exists():
        raise FileNotFoundError(f"Schema version {version} not found at {schema_path}")
    try:
        return json.loads(schema_path.read_text(encoding="utf-8"))
    except JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in schema file: {e.msg}")


def build_prompt_with_schema(resume_text: str, schema_version: str = DEFAULT_SCHEMA_VERSION) -> str:
    """
    Build a structured prompt using the schema and template.
    """
    schema_json = json.dumps(load_resume_schema(schema_version), ensure_ascii=False, indent=2)
    template_path = Path(__file__).resolve().parent.parent / "prompts" / "resume_prompt.txt"
    if not template_path.exists():
        raise FileNotFoundError(f"Prompt template not found at {template_path}")

    template = template_path.read_text(encoding="utf-8")

    prompt = (
        template
        .replace("{{schema_version}}", schema_version)
        .replace("{{schema_json}}", schema_json)
        .replace("{{resume_text}}", resume_text[:15000])
    )
    return prompt


def parse_resume_text(resume_text: str, schema_version: str = DEFAULT_SCHEMA_VERSION) -> dict:
    """
    Parse resume text into structured JSON following the provided schema.

    Uses the OpenAI Responses API (structured mode) with schema validation.
    """
    try:
        #schema = load_resume_schema(schema_version)
        
        #prompt = build_prompt_with_schema(resume_text, schema_version)
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        print("********************")
        print(resume_text[:200])
        print("********************")
        model_name = os.getenv("OPENAI_CHAT_MODEL", "gemini-1.5-flash")
        # ✅ Use Responses API with schema-guided parsing
        completion = client.beta.chat.completions.parse(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a professional multilingual résumé and curriculum vitae parser. Extract structured candidate profile information."},
                {"role": "user", "content": resume_text},
            ],
            response_format=CandidateProfile,  # ← the schema defines the expected structure
        )

        # Try to get structured result
        # Because we return a dict from this function to match the rest of the app:
        parsed = completion.choices[0].message.parsed.model_dump()
        return parsed
    except Exception as e:
        return {"error": str(e)}
