# CEE (Code Execution Engine)
The service is designed for secure remote execution of programming code. 
The main idea behind it is using Docker an K8S for executing each request in a separate container.
The service was created as an alternative to [Execution/Jail server for VPL](https://github.com/jcrodriguez-dis/vpl-xmlrpc-jail).
It has good backward compatibility with the Jail server since it supports XML API. A request to the jail server should be easily substituted with a request to CEE without changing the request body.
However, NOT ALL the parameters that are used by the Jail server are used by CEE due to design differences. Even though all the parameters will be accepted, NOT all will be used.
To see which parameters are used, please refer to the JSON API which accepts only the parameters that are used.

The project is built using the following tools:
 - NodeJS (Express.js)
 - Redis
 - Docker
 - Kubernetes
 
## Running

In order to launch the service the [kubectl](https://kubernetes.io/docs/reference/kubectl/overview/) should be installed and configured.
The ony command that needs to be executed is:
```bash
kubectl apply -f deployment.yaml
```

## API Endpoints

```http request
POST /ok
```
The endpoint can be used for checking whether the app is up and running. It should respond with `OK!` message if everything is ok.

```http request
POST /{runner}
```
The endpoint which is used to submit programming code for execution. `{runner}` should be substituted with a valid runner (like `php7.1`, `java8`, etc.). The list of available runners can be obtained by running the `available` command.

```http request
POST /
```
This endpoints is for all the other commands supported by CEE (like checking if the code is running now, stopping, getting result, etc.).

## Supported commands

HTTP:
 - `available` - http request for checking the service for availability of resources, current load and available runners
 - `request` - http request for submitting code for execution
 - `running` - http request for checking of the code is running at the moment
 - `getresult` - http request for getting execution result
 - `stop` - http request for stopping execution
 
WS:
 - `execute` - websocket connection for executing code and getting result
 - `monitor` - websocket connection for monitoring code execution and getting description of steps that were taken to execute code
 
## General request structure
HTTP JSON API
```json
{
  "command": "command_name",
  "params": {
    "param_name_1": "param_value_1",
    "param_name_2": "param_value_2"
  }
}
```

HTTP XML API
```xml
<?xml version="1.0" encoding="UTF-8"?>
<methodCall>
<methodName>command_name</methodName>
<params>
 <param>
  <value>
   <struct>
    <member>
     <name>param_name_1</name>
     <value>
      <int>param_value_1</int>
     </value>
    </member>
    <member>
     <name>param_name_2</name>
     <value>
      <string>param_value_2</string>
     </value>
    </member>
   </struct>
  </value>
 </param>
</params>
</methodCall>
```

Execution websocket URI:
```http request
ws[s]://{domain_name/ip_address}/{execution_ticket}/execute
```

Monitor websocket URI:
```http request
ws[s]://{domain_name/ip_address}/{execution_ticket}/monitor
```

## Examples

The examples below show how to use the service assuming it is deployed locally. For remote access, only the host name should be changed.
Below, only examples with JSON API are provided, please check the doc folder for seeing what the XML requests should look like.

### Checking service for availability

 - REQUEST URI:
    ```http request
    POST http://localhost/
    ```
 - REQUEST BODY
    ```json
    {
        "command": "available",
        "params": {
            "maxMemory": 67108864
        }
    }
    ```
   Params description
   - `maxMemory` - amount of RAM needed (in bytes)
 - RESPONSE
    ```json
    {
        "status": "ready",
        "load": 0,
        "maxTime": 60,
        "maxFileSize": 67108864,
        "maxMemory": 67108864,
        "maxProcesses": 64,
        "securePort": 443,
        "runners": [
            "php7.1",
            "php7.2",
            "java8",
            "java12"
        ]
    }
    ```
   Response description
   - `status` - `ready` if the service is ready to accept requests for execution, `busy` if not
   - `load` - the number of requests currently being processed
   - `maxTime` - the biggest time limit that can be set (in seconds)
   - `maxFileSize` - the biggest storage limit that can be set (in bytes)
   - `maxMemory` - the biggest RAM limit that can be set (in bytes)
   - `maxProcesses` - the limit for the number of processes
   - `securePort` - this field is not used at the moment
   - `runners` - the list of available runners

### Submit code for execution

 - REQUEST URI:
    ```http request
    POST http://localhost/php7.1
    ```
 - REQUEST BODY
    ```json
    {
        "command": "request",
        "params": {
            "maxTime": 60,
            "maxFileSize": 67108864,
            "maxMemory": 67108864,
            "execute": "vpl_run.sh",
            "interactive": true,
            "files": [
                {
                    "name": "test.php",
                    "content": "<?php echo 'Hello world!';"
                },
                {
                    "name": "vpl_run.sh",
                    "content": "#!/bin/sh\necho \"php test.php\" >> vpl_execution\nchmod +x vpl_execution"
                }
            ]
        }
    }
    ```
   Params description
   - `maxTime` - the maximum amount of time (seconds) the code can be executed, if exceeds it will be terminated
   - `maxFileSize` - the maximum amount of disk space (bytes) to be used, if exceeds it will be terminated
   - `maxMemory` - the maximum amount of RAM (bytes) to be used, if exceeds it will be terminated
   - `execute` - the file from which the execution should starts
   - `interactive` - whether the execution should be interactive (starts on connection to a web socket) or in background (starts immediately after submission)
   - `files` - array which describes the files(and their content) that should be created before execution begins
 - RESPONSE
    ```json
    {
        "adminTicket": 1098912488326,
        "monitorTicket": 1100560939127,
        "executionTicket": 1101122843767,
        "port": 80,
        "securePort": 443
    }
    ```
   Response description
   - `adminTicket` - the ticket which can be used for executing `running`, `getresult`, `stop` commands
   - `monitorTicket` - the ticket which can be used for connecting to a web socket for an interactive monitoring (valid only if `interactive` is `true`)
   - `executionTicket` - the ticket which can be used for connecting to a web socket for an interactive execution (valid only if `interactive` is `true`)
   
### Using websocket for execution and getting result

The websocket can be used only if `interactive` is `true`

 - REQUEST URI:
    ```http request
    ws://localhost/1101122843767/execute
    ```
   The ticket used in the URI is the execution ticket.
 - RESPONSE
 
    In the response, the server may send the result of execution as well as the following messages in case if something went wrong:
    - `CEE: out of time (60s)`
    - `CEE: out of memory (64MiB)`
    - `CEE: out of storage (64MiB)`
    - `CEE: execution was manually stopped`
    - `CEE: execution failed (unknown reason)`

### Using websocket for monitoring execution

The websocket can be used only if `interactive` is `true`

 - REQUEST URI:
    ```http request
    ws://localhost/1100560939127/monitor
    ```
   The ticket used in the URI is the monitor ticket.
 - RESPONSE
 
    In the response, the server a couple of messages out of those listed below:
    - `job:created`
    - `job:watching`
    - `execution:started`
    - `execution:stopped`
    - `execution:finished`
    - `execution:failed:out-of-time`
    - `execution:failed:out-of-memory`
    - `execution:failed:out-of-storage`
    - `execution:failed:unknown-reason`
    - `server:internal-error`

### Checking of the code is running at the moment

 - REQUEST URI:
    ```http request
    POST http://localhost/
    ```
 - REQUEST BODY
    ```json
    {
        "command": "running",
        "params": {
            "adminticket": 1098912488326
        }
    }
    ```
   Params description
   - `adminticket` - the admin ticket, it is part of the response from the server to the request of submitting code
 - RESPONSE
    ```json
    {
        "running": false
    }
    ```
   Response description
   - `running` - boolean value, `true` if running, `false` if not

### Getting execution result

 - REQUEST URI:
    ```http request
    POST http://localhost/
    ```
 - REQUEST BODY
    ```json
    {
        "command": "getresult",
        "params": {
            "adminticket": 1098912488326
        }
    }
    ```
   Params description
   - `adminticket` - the admin ticket, it is part of the response from the server to the request of submitting code
 - RESPONSE
    ```json
    {
        "compilation": "",
        "execution": "Hello world!",
        "executed": true,
        "interactive": false
    }
    ```
   Response description
   - `compilation` - this fields is not used for now
   - `execution` - execution result
   - `executed` - boolean value, `true` if already executed, `false` if not
   - `interactive` - boolean value, `true` if the request was made for interactive execution, `false` if not

### Stopping execution

 - REQUEST URI:
    ```http request
    POST http://localhost/
    ```
 - REQUEST BODY
    ```json
    {
        "command": "stop",
        "params": {
            "adminticket": 1098912488326
        }
    }
    ```
   Params description
   - `adminticket` - the admin ticket, it is part of the response from the server to the request of submitting code
 - RESPONSE
    ```json
    {
        "stop": false
    }
    ```
   Response description
   - `stop` - boolean value, `true` if the execution was stopped, `false` if not

## Configuring

For configuration, environment variables should be used that can be set in the `deployment.yaml` file.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate (if you can find them :wink:).

## License
[ISC](https://choosealicense.com/licenses/isc/)