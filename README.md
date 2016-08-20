# Mason CLI

The Mason CLI makes getting started with Docker a breeze - it's like buildpacks for Docker.

Whether you're new to Docker or a pro, you'll love how it just works straight out of the box.

![mason-craft-command](craft-command.png)

## Installation
Install the Mason CLI as a global NPM package like so:
```
npm install --global codemason
```

## Usage
Now you've installed Mason, you can Dockerize your applications with just one command!
```
$ mason craft <craft-kit>
```

For example
```
$ mason craft laravel
```
The above command pulls the craft kit from [codemasonhq/craft-kit-laravel](https://github.com/CodemasonHQ/craft-kit-laravel) and generates a `Dockerfile` and `docker-compose.yml` file for you based on what's defined in the craft kit. The generated files will be added to the current working directory.

Or if you want to get a little bit more specific, you can specify exactly what containers from the craft kit you want to use.
```
$ mason craft laravel --with="php, postgres"
```

## Craft Kits
Craft kits are a super flexible and portable way to define Docker environments. They are an excellent way to ease into building Docker powered apps without having to learn the ins and outs of Docker.

Official craft kits provide an opinionated starting point for Dockerizing your apps. We've carefully selected and specifically created Docker images that play together nicely so you can Dockerize your apps with a single command.

You can find all the official craft kits within the [CodemasonHQ organisation](https://github.com/codemasonhq) with the prefix `craft-kit-`. We aim to support as many popular frameworks, architectures and languages as possible.

Officially supported craft kits: 
- [laravel](https://github.com/codemasonhq/craft-kit-laravel) 

Community contributed craft kits: 
- PRs welcome


## Custom Craft Kits
While we recommend the official craft kits for simplicity and compatibility with what we have planned, custom craft kits give you an added level of flexibility. Anyone can create a craft kit and use it with: 
```
$ mason craft username/repo
```
Where `username/repo` is the short hand for the repository to retrieve. 
- GitHub - `github:username/repo` or simply `username/repo`
- GitLab - `gitlab:username/repo`
- BitBucket - `bitbucket:username/repo`

By default it will use the `master` branch, but you can specify a branch or a tag like so `username/repo#branch`. You may also use the `--clone` flag so your SSH keys are used (allowing you to access your private repositories).

## Local Craft Kits
You may also use a local craft kit.
```
$ mason craft ~/path/to/my/craft-kit
```

## Creating a Craft Kit
Craft kits are light weight javascript applications. They require one `index.js` file as an entry point which exposes the craft kit to the CLI. Beyond that, you can structure it however you see fit.

A nice example is the [laravel craft kit](https://github.com/CodemasonHQ/craft-kit-laravel).

### index.js
| Property | Description                                                                       |
| -------- | --------------------------------------------------------------------------------- |
| name     | *[string]* Simple name for your craft kit                                         |
| default  | *[array]* Default containers for craft kit to use                                 | 
| masonJson | *[object]* [Mason JSON](http://mason.ci/docs/mason-json) for available containers |

Example
```javascript
module.exports = {
  name: 'laravel',
  default: ["php", "mysql"],
  masonJson: {
  	php: require('./mason-json/php.js'),
  	mysql: require('./mason-json/mysql.js')
  },
}
```

### Mason JSON 
Define the available containers using [Mason JSON](mason.ci/docs/mason-json). Mason JSON is a JSON schema that is deliberately modelled of the `docker-compose.yml` file. It makes it a little bit easier to deal with all the Docker configuration options and adds a little bit of extra functionality. 

**mason-json/php.js**
```javascript
module.exports = {
    name: 'php', 
    image: 'codemasonhq/php',
    type: 'instance',
    volumes: {
        './':'/app',
    },
    ports: [
        "80:80",
        "443:443"
    ],
}
```

**mason-json/mysql.js**
```javascript
module.exports = {
    name: 'mysql',
    image: 'mysql',
    type: 'service',
    volumes: {
        '/var/lib/mysql':'/var/lib/mysql'
    },
    ports: ["3306:3306"],
    environment: {
        'MYSQL_DATABASE': 'demo',
          'MYSQL_USER': 'demo',
          'MYSQL_PASSWORD': 'secret',
          'MYSQL_ROOT_PASSWORD': 'root'
    }
}
```

#### Services vs Instances
In the Mason JSON for your craft kit, you may set the `type` as `service` or `instance`. 

An `instance` is your main process, it runs your application (generally an `instance` is a language). It is used as the base image to build `FROM` in your Dockerfile. Currently the craft command only supports one `instance` per kit.

And a `service` is typically something your app utilises like MySQL, Redis or Postgres etc.

## Additional Documentation 
Additional documentation for the Mason CLI can be found on the [Codemason website](http://mason.ci/docs/mason-cli).

## License
The MIT License (MIT). Please see [License File](LICENSE.md) for more information.