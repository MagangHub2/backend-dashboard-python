from pydantic import BaseModel, EmailStr, field_validator
from enum import Enum


class RoleEnum(str, Enum):
    admin = "admin"
    karyawan = "karyawan"


class RegisterSchema(BaseModel):
    name: str
    email: EmailStr
    username: str
    password: str
    phone: str | None = None
    role: RoleEnum

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str):
        v = v.strip()
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Password maksimal 72 karakter")
        if len(v) < 6:
            raise ValueError("Password minimal 6 karakter")
        return v


class LoginSchema(BaseModel):
    identifier: str
    password: str
