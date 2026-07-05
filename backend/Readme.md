# Backend Setup (FastAPI):

```bash
# bash/terminal
cd .\backend\
python -m venv .venv
# python 3.14 recommended

# On windows:
.venv\Scripts\activate

# On Mac:
source .venv/bin/activate

# Then install packages:
pip install -r requirements.txt

# update db schema
alembic upgrade head
# when you add the packages use `pip freeze > requirements.txt` to store it s version in requirements.txt

# Run the Project (API):
uvicorn main:app --reload
```

> **Note:** `requirements.txt` file contain the version of packages used
Avoid loose version like fastapi>=0.100

## Database schema alembic instructions

> When ever you made changes in `models.py` i.e schema always follow steps:
1. run commad `alembic revision --autogenerate -m "commit_meessage_like_git"` 
2. Insure new version file is added in alembic/versions/ and in that file `import sqlmodel` is present.
3. Run commad alembic upgrade head.
4. do git commit and push code and notify everyone.
