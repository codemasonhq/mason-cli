# Mason CLI

The Mason CLI makes getting started with Docker a breeze. 

We've carefully selected and specifically created Docker images that play together nicely so you can Dockerize your apps with a single command. It's like buildpacks for Docker.

Whether you're new to Docker or a pro, you'll love how it just works straight out of the box.

## Installation
Install the Mason CLI as a global NPM package like so:
```
npm install --global mason
```

## Usage
Now you've installed Mason, you're ready to start building and deploying applications!

### The `craft` command
You can use the `craft` command to Dockerize your application.
```
$ mason craft laravel 
```
The generated files will be added to the current working directory.

Or if you want to get a little bit more specific you can specify exactly what containers you want to use
```
$ mason craft --with="php, nginx, mysql"
```
![mason-craft-command](craft-command.png)


### Supported Setups
We aim to support as many popular frameworks and architectures as possible.

#### Supported Pre-packed Application Environments
- Laravel

#### Supported Containers
- PHP
- MySQL
- NGINX

## Example Flow 

- Create a new directory for your new application `mkdir ~/pebble`
- Change into your new directory `cd ~/pebble` 
- Create a new Laravel project within your directory `laravel new pebble`
- Dockerize Laravel with `mason craft laravel`
- Spin up your environment `docker-compose up`

**That's all!** You're now running your Laravel application with Docker!


## Official Documentation 
Full documentation for the Mason CLI can be found on the [Codemason website](http://mason.ci/docs/mason-cli).


## License
The MIT License (MIT). Please see [License File](LICENSE.md) for more information.