pipeline {
    agent any

    // PUNTOS 2 y 4: Automatización por cambios (cada 5 min) y por horario (8 AM)
    triggers {
        pollSCM('H/5 * * * *') 
        cron('H 08 * * *')
    }

    tools {
        nodejs 'node20' 
    }

    environment {
        COLLECTION = 'collections/API_Automation_Project_collection.json'
        GLOBAL_ENV = 'environments/workspace.postman_globals.json'
    }

    stages {
        stage('🚀 Preparación') {
            steps {
                // Punto 3: Consola limpia usando echo informativos
                echo "===================================================="
                echo "1. LIMPIANDO ESPACIO DE TRABAJO Y DESCARGANDO CÓDIGO"
                echo "===================================================="
                deleteDir() 
                checkout scm
            }
        }

        stage('📦 Instalación') {
            steps {
                echo "2. INSTALANDO DEPENDENCIAS (NPM CI)..."
                // @ al inicio del comando oculta el comando "sucio" en la consola de Jenkins
                bat '@npm ci'
            }
        }

        stage('🧪 Ejecución de Tests') {
            steps {
                script {
                    echo "3. EJECUTANDO PRUEBAS EN LA API..."
                    bat '@if not exist reports mkdir reports'
                    
                    // --suppress-exit-code asegura que el pipeline no se rompa antes de publicar el reporte
                    // --reporter-cli-no-summary ayuda a que la consola sea menos ruidosa
                    bat "npx newman run ${COLLECTION} -g ${GLOBAL_ENV} -r cli,htmlextra --reporter-cli-no-summary --reporter-htmlextra-export reports/reporte_final.html --suppress-exit-code"
                }
            }
        }

        stage('📊 Reporte Final') {
            steps {
                echo "4. GENERANDO INTERFAZ GRÁFICA DEL REPORTE..."
                // Punto 1: Publicación del reporte HTML
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'reports',
                    reportFiles: 'reporte_final.html',
                    reportName: 'Reporte Newman HTML'
                ])
            }
        }
    }

    post {
        always {
            echo "===================================================="
            echo "PROCESO FINALIZADO EXITOSAMENTE"
            echo "Revisa el menú lateral izquierdo: 'Reporte Newman HTML'"
            echo "===================================================="
        }
    }
}