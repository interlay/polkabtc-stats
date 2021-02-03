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
    - name: openapi
      image: openapitools/openapi-generator-cli:v5.0.0
      imagePullPolicy: Always
      command:
        - cat
      tty: true
      securityContext:
        allowPrivilegeEscalation: false
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
        // stage('Prepare') {
        //     steps {
        //       sh 'yarn install'
        //     }
        // }
        // stage('Build docker image') {
        //     environment {
        //         PATH        = "/busybox:$PATH"
        //         REGISTRY    = 'registry.gitlab.com' // Configure your own registry
        //         REPOSITORY  = 'interlay'
        //         IMAGE       = 'polkabtc-stats'
        //     }
        //     steps {
        //         container(name: 'kaniko', shell: '/busybox/sh') {
        //             sh '''#!/busybox/sh
        //             GIT_BRANCH_SLUG=$(echo $GIT_BRANCH | sed -e 's/\\//-/g')
        //             /kaniko/executor -f `pwd`/Dockerfile -c `pwd` \
        //                 --destination=${REGISTRY}/${REPOSITORY}/${IMAGE}:${GIT_BRANCH_SLUG} \
        //                 --destination=${REGISTRY}/${REPOSITORY}/${IMAGE}:${GIT_BRANCH_SLUG}-${GIT_COMMIT:0:6}
        //             '''
        //         }
        //     }
        // }
        stage('Release') {
          when {
            tag '*'
          }
          environment {
              NODE_AUTH_TOKEN = credentials('node_auth_token')
          }
          steps {
            sh 'yarn install'
            sh 'yarn build'
            container(name: 'openapi', shell: '/bin/bash') {
                sh 'ls -la'
                sh '/usr/local/bin/docker-entrypoint.sh generate -i build/swagger.json -g typescript-axios -o client'
            }
            sh 'yarn compile:client'
            sh 'git config --global user.email "${GIT_AUTHOR_NAME}"'
            sh 'git config --global user.name "${GIT_AUTHOR_EMAIL}"'
            sh 'echo ${TAG_NAME}'
            sh 'yarn publish --access public --new-version ${TAG_NAME}'
          }
        }

    }
    post {
      always {
        discordSend description: "Jenkins Pipeline Build", footer: "Footer Text", link: env.BUILD_URL, result: currentBuild.currentResult, title: JOB_NAME, webhookURL: env.DISCORD_WEBHOOK_URL
      }
    }
}
