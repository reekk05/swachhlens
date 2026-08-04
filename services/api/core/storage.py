import uuid
from core.supabase_client import supabase

BUCKET = "complaint-photos"


def upload_complaint_photo(file_bytes: bytes, content_type: str) -> str:
    """Uploads a photo and returns its storage path (not a public URL, since bucket is private)."""
    file_ext = content_type.split("/")[-1]
    path = f"{uuid.uuid4()}.{file_ext}"

    supabase.storage.from_(BUCKET).upload(
        path, file_bytes, {"content-type": content_type}
    )
    return path


def get_signed_url(path: str, expires_in: int = 3600) -> str:
    """Generates a temporary signed URL so staff can view a private photo."""
    result = supabase.storage.from_(BUCKET).create_signed_url(path, expires_in)
    return result["signedURL"]
