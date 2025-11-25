# Base Image: Python ရဲ့ official image ကို သုံးပါ
FROM python:3.10-slim

# Working Directory ကို သတ်မှတ်ခြင်း
WORKDIR /code

# Requirements file ကို container ထဲသို့ ကူးယူပါ
COPY ./requirements.txt /code/requirements.txt

# Dependencies များကို Install လုပ်ပါ
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Application code များကို ကူးယူပါ
COPY ./app /code/app

# Server စတင်ရန် Command ကို သတ်မှတ်ခြင်း
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]