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

# Run the Project (API):
uvicorn main:app --reload
```


> **Note:** `requirements.txt` file contain the version of packages used
Avoid loose version like fastapi>=0.100

