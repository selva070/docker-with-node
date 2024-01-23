const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require('child_process');
const morgan = require("morgan");

const PORT = 3000;

const app = express();

// set up morgan middleware
app.use(morgan("tiny"));

// Middleware to parse JSON body
app.use(bodyParser.json());

app.post("/dockerhub-webhook", (req, res) => {
  try {
    // Verify that the request is a Docker Hub webhook ping
    if (req.body && req.body.zen) {
      console.log('Docker Hub webhook ping received:', req.body.zen);
      return res.status(200).send('Webhook Ping Received');
    }

    // Handle other Docker Hub webhook events here
    console.log("Docker Hub webhook event received:", req.body);

    // Pull the latest Docker image
    const repository = req.body.repository.repo_name;
    const tag = req.body.push_data.tag;


    console.log(`docker pull ${repository}:${tag}`);
    exec(`docker pull ${repository}:${tag}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error pulling Docker image: ${error.message}`);
        return res.status(500).send("Internal Server Error");
      }

      console.log(`Docker image pulled successfully: ${repository}:${tag}`);

      // Start a Docker container
      const containerName = req.body.repository.name;
      const hostPort = 4000; // Change this to the desired host port
      const containerPort = 3000; // Change this to the desired container port
  
      // Check if a container is already running on the specified host port
      exec(`docker ps -q --filter "name=${containerName}" --filter "publish=${hostPort}"`, (error, stdout, stderr) => {
        if (stdout.trim() !== '') {
          // Stop and remove the existing container
          exec(`docker stop ${containerName} && docker rm ${containerName}`, (error, stdout, stderr) => {
            if (error) {
              console.error(`Error stopping/removing existing container: ${error.message}`);
              return res.status(500).send('Internal Server Error');
            }

            startContainer();
          });
        } else {
          // No existing container on the specified port, start a new one
          startContainer();
        }
      });

      function startContainer() {
        exec(`docker run -d --name ${containerName} -p ${hostPort}:${containerPort} ${repository}:${tag}`, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error starting Docker container: ${error.message}`);
            return res.status(500).send('Internal Server Error');
          }

          console.log(`Docker container started successfully: ${containerName} on port ${hostPort}`);
          return res.status(200).send('Webhook Event Received');
        });
      }
      // Ends
    });
  } catch (error) {
    console.log("error", error);
  }
});

app.get("/", (req, res) => {
  res.send("Hello From Express Server!");
});

app.listen(PORT, () => {
  console.log(`Node server listening on ${PORT}`);
});
