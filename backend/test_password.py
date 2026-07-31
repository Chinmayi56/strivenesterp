from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

hashed_password = "$2b$12$uR04LxJuHfA9HRX4YezkmeItiJGME/0OfjMdnADBwOEkHCkMASMB."

password = "Admin@123"

print(
    pwd_context.verify(password, hashed_password)
)