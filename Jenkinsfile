pipeline {
    agent any

    environment {
        IMAGE_NAME = 'msms-frontend'
        REGISTRY = 'tu-registro-docker.com' 
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Test') {
            steps {
                sh 'npm ci'
                // Reemplazar con 'npm run test' cuando agregues los tests de React
                sh 'npm run lint'
            }
        }

        stage('Build Image (Podman)') {
            steps {
                sh 'podman build -t ${IMAGE_NAME}:${env.BUILD_ID} .'
                sh 'podman tag ${IMAGE_NAME}:${env.BUILD_ID} ${IMAGE_NAME}:latest'
            }
        }

        /* 
        stage('Push Image') {
            steps {
                sh 'podman push ${IMAGE_NAME}:${env.BUILD_ID} docker://${REGISTRY}/${IMAGE_NAME}:${env.BUILD_ID}'
                sh 'podman push ${IMAGE_NAME}:latest docker://${REGISTRY}/${IMAGE_NAME}:latest'
            }
        }
        */
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo '¡Pipeline del Frontend ejecutado con éxito!'
        }
        failure {
            echo 'Error en la ejecución del pipeline del Frontend.'
        }
    }
}
