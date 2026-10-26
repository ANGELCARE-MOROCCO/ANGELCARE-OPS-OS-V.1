FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /worker
COPY requirements.txt /worker/
RUN pip install --no-cache-dir -r requirements.txt
COPY *.py /worker/
RUN useradd --uid 10001 --create-home jobkix
USER jobkix
CMD ["python","-u","worker.py"]
