from pydantic import BaseModel, EmailStr, field_validator


class UserRegister(BaseModel):
    name: str
    email: str
    password: str

    @field_validator('email')
    @classmethod
    def validate_email(cls, value: str) -> str:
        if value.endswith('@admin.local'):
            return value
        return str(EmailStr(value))


class UserLogin(BaseModel):
    email: str
    password: str

    @field_validator('email')
    @classmethod
    def validate_email(cls, value: str) -> str:
        if value.endswith('@admin.local'):
            return value
        return str(EmailStr(value))


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    plan: str
    is_admin: bool

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
