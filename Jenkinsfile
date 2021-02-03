pipeline {
    agent {
      kubernetes {
        defaultContainer 'node'
        yaml """
  kind: Pod
  spec:
    containers:
    - name: node
      image: node:15.7.0
      command:
      - cat
      tty: true
    - name: kaniko
      image: gcr.io/kaniko-project/executor:debug
      imagePullPolicy: Always
      command:
        - /busybox/cat
      tty: true
      securityContext:
        allowPrivilegeEscalation: false
      volumeMounts:
        - name: jenkins-docker-cfg
          mountPath: /kaniko/.docker
    volumes:
      - name: jenkins-docker-cfg
        projected:
          sources:
            - secret:
                name: gitlab-polkabtc-stats-registry
                items:
                  - key: .dockerconfigjson
                    path: config.json
  """
      }
    }
    environment {
        CI = 'true'
        DISCORD_WEBHOOK_URL = credentials('discord_webhook_url')
    }
    options {
        ansiColor('xterm')
    }
    stages {
        stage('Prepare') {
            steps {
              sh 'yarn install'
            }
        }
        stage('Build docker image') {
            environment {
                PATH        = "/busybox:$PATH"
                REGISTRY    = 'registry.gitlab.com' // Configure your own registry
                REPOSITORY  = 'interlay'
                IMAGE       = 'polkabtc-stats'
            }
            steps {
                container(name: 'kaniko', shell: '/busybox/sh') {
                    sh '''#!/busybox/sh
                    GIT_BRANCH_SLUG=$(echo $GIT_BRANCH | sed -e 's/\\//-/g')
                    /kaniko/executor -f `pwd`/Dockerfile -c `pwd` \
                        --destination=${REGISTRY}/${REPOSITORY}/${IMAGE}:${GIT_BRANCH_SLUG} \
                        --destination=${REGISTRY}/${REPOSITORY}/${IMAGE}:${GIT_BRANCH_SLUG}-${GIT_COMMIT:0:6}
                    '''
                }
            }
        }
        stage('Release') {
          when {
            tag '*'
          }
          steps {
            echo "Building $BRANCH_NAME"
            echo "Building $TAG_NAME"
          }
        }

    }
    post {
      always {
        discordSend description: "Jenkins Pipeline Build", footer: "Footer Text", link: env.BUILD_URL, result: currentBuild.currentResult, title: JOB_NAME, webhookURL: env.DISCORD_WEBHOOK_URL
      }
    }
}
