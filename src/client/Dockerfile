# Use an official Python runtime as a parent image.
# NOTE: some of our syntax choices require the
# python 3.12 interpreter. python 3.10 does not work.
FROM python:3.12-slim

# Set the working directory to /app.
WORKDIR /app

COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the current directory contents into the container at /app.
# That is, copy everything from the current directory 
# (client) to /app inside the container.
COPY . .

# NOTE: the ENTRYPOINT/CMD is deliberately omitted here, since the
# startup_docker_container.sh script manually specifies which
# script gets run inside this container.
