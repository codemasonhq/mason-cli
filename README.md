# Mason CLI

## Installation
Install the Mason CLI as a global NPM package:
```
npm install --global codemason
```
Prerequisites: [Git](https://git-scm.com/downloads), [Docker](https://docs.docker.com/engine/installation/)

## Usage
<!-- usage -->
```sh-session
$ npm install -g codemason
$ mason COMMAND
running command...
$ mason (-v|--version|version)
codemason/1.2.0 darwin-x64 node-v11.0.0
$ mason --help [COMMAND]
USAGE
  $ mason COMMAND
...
```
<!-- usagestop -->

## Commands
<!-- commands -->
* [`mason apps`](#mason-apps)
* [`mason apps:create NAME`](#mason-appscreate-name)
* [`mason apps:deploy NAME`](#mason-appsdeploy-name)
* [`mason apps:destroy NAME`](#mason-appsdestroy-name)
* [`mason auth`](#mason-auth)
* [`mason auth:logout`](#mason-authlogout)
* [`mason auth:token`](#mason-authtoken)
* [`mason auth:whoami`](#mason-authwhoami)
* [`mason config`](#mason-config)
* [`mason config:get KEY`](#mason-configget-key)
* [`mason config:set KEY VALUE`](#mason-configset-key-value)
* [`mason config:unset KEY`](#mason-configunset-key)
* [`mason craft KIT`](#mason-craft-kit)
* [`mason git:remote APP`](#mason-gitremote-app)
* [`mason help [COMMAND]`](#mason-help-command)
* [`mason logs APP`](#mason-logs-app)
* [`mason plugins`](#mason-plugins)
* [`mason plugins:install PLUGIN...`](#mason-pluginsinstall-plugin)
* [`mason plugins:link PLUGIN`](#mason-pluginslink-plugin)
* [`mason plugins:uninstall PLUGIN...`](#mason-pluginsuninstall-plugin)
* [`mason plugins:update`](#mason-pluginsupdate)
* [`mason run [COMMAND]`](#mason-run-command)
* [`mason services`](#mason-services)
* [`mason services:create SERVICE`](#mason-servicescreate-service)
* [`mason services:destroy SERVICE`](#mason-servicesdestroy-service)
* [`mason services:upgrade SERVICE`](#mason-servicesupgrade-service)

## `mason apps`

list your apps

```
USAGE
  $ mason apps

OPTIONS
  -e, --environment=environment  [default: development] the environment of apps to list
```

_See code: [src/commands/apps.js](https://github.com/codemasonhq/mason-cli/blob/v1.2.0/src/commands/apps.js)_

## `mason apps:create NAME`

create a new app

```
USAGE
  $ mason apps:create NAME

OPTIONS
  -e, --environment=environment  [default: development] the environment to create the app in
  -n, --no-remote                do not add a git remote
  -r, --remote=remote            [default: codemason] the git remote to create

ALIASES
  $ mason create
```

_See code: [src/commands/apps/create.js](https://github.com/codemasonhq/mason-cli/blob/v1.2.0/src/commands/apps/create.js)_

## `mason apps:deploy NAME`

deploy an app

```
USAGE
  $ mason apps:deploy NAME

OPTIONS
  -c, --compose-file=compose-file  [default: docker-compose.yml] path to a docker compose file
  -e, --environment=environment    [default: development] the environment to deploy the app to
  -m, --mason-json=mason-json      path to a mason json file
  --env-file=env-file              [default: .env] path to env file to load
  --no-env-file

ALIASES
  $ mason deploy
```

_See code: [src/commands/apps/deploy.js](https://github.com/codemasonhq/mason-cli/blob/v1.2.0/src/commands/apps/deploy.js)_

## `mason apps:destroy NAME`

permanently destroy an app

```
USAGE
  $ mason apps:destroy NAME

OPTIONS
  -e, --environment=environment  [default: development] the environment of the app
```

_See code: [src/commands/apps/destroy.js](https://github.com/codemasonhq/mason-cli/blob/v1.2.0/src/commands/apps/destroy.js)_

## `mason auth`

login to your Codemason account

```
USAGE
  $ mason auth

OPTIONS
  -e, --email=email        email
  -p, --password=password  password

ALIASES
  $ mason login
```

_See code: [src/commands/auth.js](https://github.com/codemasonhq/mason-cli/blob/v1.2.0/src/commands/auth.js)_

## `mason auth:logout`

logout of your Codemason account

```
USAGE
  $ mason auth:logout

ALIASES
  $ mason logout
```

_See code: [src/commands/auth/logout.js](https://github.com/codemasonhq/mason-cli/blob/v1.2.0/src/commands/auth/logout.js)_

## `mason auth:token`

display api token

```
USAGE
  $ mason auth:token

ALIASES
  $ mason token
```

_See code: [src/commands/auth/token.js](https://github.com/codemasonhq/mason-cli/blob/v1.2.0/src/commands/auth/token.js)_

## `mason auth:whoami`

display user info

```
USAGE
  $ mason auth:whoami

ALIASES
  $ mason whoami
```

_See code: [src/commands/auth/whoami.js](https://github.com/codemasonhq/mason-cli/blob/v1.2.0/src/commands/auth/whoami.js)_

## `mason config`

list cli config

```
USAGE
  $ mason config
```

_See code: [src/commands/config.js](https://github.com/codemasonhq/mason-cli/blob/v1.2.0/src/commands/config.js)_

## `mason config:get KEY`

get cli config value

```
USAGE
  $ mason config:get KEY
```

_See code: [src/commands/config/get.js](https://github.com/codemasonhq/mason-cli/blob/v1.2.0/src/commands/config/get.js)_

## `mason config:set KEY VALUE`

set a cli config value

```
USAGE
  $ mason config:set KEY VALUE
```

_See code: [src/commands/config/set.js](https://github.com/codemasonhq/mason-cli/blob/v1.2.0/src/commands/config/set.js)_

## `mason config:unset KEY`

unset a cli config value

```
USAGE
  $ mason config:unset KEY
```

_See code: [src/commands/config/unset.js](https://github.com/codemasonhq/mason-cli/blob/v1.2.0/src/commands/config/unset.js)_

## `mason craft KIT`

docker powered dev environments that just work

```
USAGE
  $ mason craft KIT

ARGUMENTS
  KIT  craft kit to use

OPTIONS
  -w, --with=with                  specify services to craft your app with
  --docker-compose=docker-compose  docker-compose.yml template path
  --dockerfile=dockerfile          dockerfile template path
  --gitlab-ci=gitlab-ci            .gitlab-ci.yml template path
```

_See code: [@codemason/mason-cli-craft](https://github.com/codemasonhq/mason-cli-craft/blob/v0.0.10/src/commands/craft.js)_

## `mason git:remote APP`

add a git remote

```
USAGE
  $ mason git:remote APP

OPTIONS
  -r, --remote=remote  name to give git remote
```

_See code: [src/commands/git/remote.js](https://github.com/codemasonhq/mason-cli/blob/v1.2.0/src/commands/git/remote.js)_

## `mason help [COMMAND]`

display help for mason

```
USAGE
  $ mason help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v1.2.11/src/commands/help.ts)_

## `mason logs APP`

display recent log output

```
USAGE
  $ mason logs APP

ARGUMENTS
  APP  app to run command against

OPTIONS
  -e, --environment=environment  [default: development] the environment of apps to list
  -t, --tail                     continually stream logs
  --service=service              only show output from this service
```

_See code: [src/commands/logs.js](https://github.com/codemasonhq/mason-cli/blob/v1.2.0/src/commands/logs.js)_

## `mason plugins`

list installed plugins

```
USAGE
  $ mason plugins

OPTIONS
  --core  show core plugins

EXAMPLE
  $ mason plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.7.7/src/commands/plugins.ts)_

## `mason plugins:install PLUGIN...`

installs a plugin into the CLI

```
USAGE
  $ mason plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  plugin to install

OPTIONS
  -f, --force    yarn install with force flag
  -h, --help     show CLI help
  -v, --verbose

DESCRIPTION
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command 
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in 
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ mason plugins:add

EXAMPLES
  $ mason plugins:install myplugin 

  $ mason plugins:install https://github.com/someuser/someplugin

  $ mason plugins:install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.7.7/src/commands/plugins/install.ts)_

## `mason plugins:link PLUGIN`

links a plugin into the CLI for development

```
USAGE
  $ mason plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

OPTIONS
  -h, --help     show CLI help
  -v, --verbose

DESCRIPTION
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello' 
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLE
  $ mason plugins:link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.7.7/src/commands/plugins/link.ts)_

## `mason plugins:uninstall PLUGIN...`

removes a plugin from the CLI

```
USAGE
  $ mason plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

OPTIONS
  -h, --help     show CLI help
  -v, --verbose

ALIASES
  $ mason plugins:unlink
  $ mason plugins:remove
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.7.7/src/commands/plugins/uninstall.ts)_

## `mason plugins:update`

update installed plugins

```
USAGE
  $ mason plugins:update

OPTIONS
  -h, --help     show CLI help
  -v, --verbose
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v1.7.7/src/commands/plugins/update.ts)_

## `mason run [COMMAND]`

run a one-off process inside service

```
USAGE
  $ mason run [COMMAND]

OPTIONS
  -e, --environment=environment  [default: development] the environment of apps to list
  --service=service              (required) service to run one-off command, formatted as `<app>/<service>`

ALIASES
  $ mason run
```

_See code: [src/commands/run.js](https://github.com/codemasonhq/mason-cli/blob/v1.2.0/src/commands/run.js)_

## `mason services`

list your services

```
USAGE
  $ mason services

OPTIONS
  -e, --environment=environment  [default: development] the environment of services to list
```

_See code: [src/commands/services.js](https://github.com/codemasonhq/mason-cli/blob/v1.2.0/src/commands/services.js)_

## `mason services:create SERVICE`

create a new service

```
USAGE
  $ mason services:create SERVICE

ARGUMENTS
  SERVICE  service to create formatted as `<app>/<service>`

OPTIONS
  -c, --command=command          command for service to run
  -e, --environment=environment  [default: development] the environment to access
  -i, --image=image              image for service to run
  -l, --link=link                link to another service
  -p, --port=port                ports to define on service
  -v, --volume=volume            volume to mount on service
  --env=env                      env variable available to the service
  --env-file=env-file            path to env file to load
```

_See code: [src/commands/services/create.js](https://github.com/codemasonhq/mason-cli/blob/v1.2.0/src/commands/services/create.js)_

## `mason services:destroy SERVICE`

permanently destroy an app

```
USAGE
  $ mason services:destroy SERVICE

ARGUMENTS
  SERVICE  service to destroy formatted as `<app>/<service>`

OPTIONS
  -e, --environment=environment  [default: development] the environment the app is located in
```

_See code: [src/commands/services/destroy.js](https://github.com/codemasonhq/mason-cli/blob/v1.2.0/src/commands/services/destroy.js)_

## `mason services:upgrade SERVICE`

upgrade a service

```
USAGE
  $ mason services:upgrade SERVICE

ARGUMENTS
  SERVICE  service to create formatted as `<app>/<service>`

OPTIONS
  -c, --command=command          command for service to run
  -e, --environment=environment  [default: development] the environment the service is located in
  -i, --image=image              image for service to run
  -l, --link=link                link to another service
  -p, --port=port                ports to define on service
  -v, --volume=volume            volume to mount on service
  --cancel                       cancel an upgrade
  --cancel-rollback              cancel a rollback
  --env=env                      env variable available to the service
  --env-file=env-file            path to env file to load
  --finish                       finish an upgrade
  --rollback                     rollback an upgrade
```

_See code: [src/commands/services/upgrade.js](https://github.com/codemasonhq/mason-cli/blob/v1.2.0/src/commands/services/upgrade.js)_
<!-- commandsstop -->

## Additional Documentation 
Additional documentation for the Mason CLI can be found on the [Codemason website](https://codemason.io/docs/mason-cli).
