import jwt
from jwt import PyJWKClient
from fastapi import Header

SUPABASE_PROJECT_URL = "https://vumthonyqjexzhfijjni.supabase.co"
JWKS_URL = f"{SUPABASE_PROJECT_URL}/auth/v1/.well-known/jwks.json"

_jwk_client = PyJWKClient(JWKS_URL)


def get_current_user_id(authorization: str = Header(None)) -> str | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.replace("Bearer ", "")

    try:
        signing_key = _jwk_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated",
        )
        return payload.get("sub")
    except Exception:
        return None
