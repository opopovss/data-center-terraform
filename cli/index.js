const inquirer = require('inquirer');
const Rx = require('rxjs')
const chalk = require('chalk');
const emoji = require('node-emoji');
const figlet = require('figlet');
const fuzzy = require('fuzzy');
const _ = require('lodash');
const fs = require('fs')
const path = require('path')
const mustache = require('mustache')
awsDBInstances = require('./assets/awsMetadata').awsDBInstances
awsInstances = require('./assets/awsMetadata').awsInstances
awsRegions = require('./assets/awsMetadata').awsRegions


figlet.text('DC Terraform', {
    font: 'block',
    horizontalLayout: 'default',
    verticalLayout: 'default',
    width: 200,
    whitespaceBreak: true
}, async function (err, data) {
    if (err) {
        console.log('Something went wrong...');
        console.dir(err);
        return;
    }
    inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

    console.log(chalk.magentaBright(`${data}`), '\n');
    console.log(chalk.magentaBright(`Welcome to Atlassian DC Terraform!`), "\n");

    const configChoice = await askConfigOption(inquirer)

    const config = configChoice.configChoice == 'Quick start (use predefined value)' ? await createDefaultConfig(inquirer) : await createCustomConfig(inquirer)
    runCofig(config)
});

async function askConfigOption(inquirer) {
    return inquirer
        .prompt([
            {
                type: 'list',
                name: 'configChoice',
                message: `Select deployment strategy`,
                choices: ['Quick start (use predefined value)', 'Custom']
            }
        ])
}

async function createDefaultConfig(inquirer) {
    console.log(chalk.magentaBright(`Default Configuration`), "\n");
    const result = await askMandatoryQuestions(inquirer)
    let config = {
        ...result,
        instanceType: 'm5.4xlarge',
        desiredCapacity: 2,
        productAdminUsername: 'admin',
        productAdminPassword: Math.random().toString(36).slice(-8),
        productLicenseKey: '',
        productDomain: '',
        datasetURL: '',
        productHelmChartVersion: '1.0.0',
        productCPU: '1',
        productMemory: '1Gi',
        productMinHeap: '256m',
        productMaxHeap: '512m',
        agentCPU: '0.25',
        agentMemory: '256m',
        numOfAgents: 5,
        dbInstanceClass: 'db.m5.large',
        dbAllocatedStorage: 100,
        dbIops: 1000,
    }
    config = handleOptionalValue(config)
    return config

}

async function createCustomConfig(inquirer) {
    console.log(chalk.magentaBright(`Custom Configuration`), "\n");
    console.log(chalk.magentaBright(`${emoji.get('wheel_of_dharma')} Collecting cluster data`), "\n");
    const clusterData = await askClusterData(inquirer)

    console.log(chalk.magentaBright(`${emoji.get('tanabata_tree')} Collecting Product data`, '\n'));
    const productData = await askProductData(inquirer)

    console.log(chalk.magentaBright(`${emoji.get('floppy_disk')} Collecting Database data`), '\n');
    const dbData = await askDBData(inquirer)

    let config = { ...clusterData, ...productData, ...dbData }
    config = handleOptionalValue(config)
    return config
}

async function askMandatoryQuestions(inquirer) {
    return inquirer.prompt([
        {
            type: 'autocomplete',
            name: 'region',
            message: `${emoji.get('earth_africa')} Select a region:`,
            pageSize: 6,
            source: searchRegions
        },
        {
            type: 'input',
            name: 'envName',
            message: `Name your terraform environment`,
            default: 'my-env-1',
            validate(answer) {
                if (answer.match(/^[a-z][a-z0-9\\-]/g) == null || answer.length > 24) {
                    return `Valid name is up to 24 characters starting with lower case alphabet and followed by alphanumerics. '-' is allowed as well.`;
                }
                return true;
            },
        }, {
            type: 'input',
            name: 'productAdminEmail',
            message: `Provide an Email`,
            mask: true,
            validate(answer) {
                if (answer.toLowerCase()
                    .match(
                        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                    ) == null) {
                    return ` Email address not valid.`;
                }
                return true;
            },
        }])
}


async function askClusterData(inquirer) {
    return inquirer.prompt([
        {
            type: 'autocomplete',
            name: 'region',
            message: `${emoji.get('earth_africa')} Select a region:`,
            pageSize: 6,
            source: searchRegions
        },
        {
            type: 'autocomplete',
            name: 'instanceType',
            message: `${emoji.get('computer')} Select an instance type:`,
            pageSize: 6,
            source: searchInstanceTypes
        },
        {
            type: 'input',
            name: 'desiredCapacity',
            message: `Number of nodes in cluster:`,
            default: 2,
            validate(answer) {
                if (answer > 10 || answer < 1) {
                    return `Invalid capacity. Maximum number is 10`;
                }
                if (isNaN(answer)) {
                    return `Input should be a number`;
                }
                return true;
            },
        },
        {
            type: 'input',
            name: 'envName',
            message: `Name your terraform environment`,
            default: 'my-env-1',
            validate(answer) {
                if (answer.match(/^[a-z][a-z0-9\\-]/g) == null || answer.length > 24) {
                    return `Valid name is up to 24 characters starting with lower case alphabet and followed by alphanumerics. '-' is allowed as well.`;
                }
                return true;
            },
        },
        {
            type: 'editor',
            name: 'tags',
            message: `Provide resource tags (Optional
                ). e.g. key = "value"`,
        }]);
}


async function askProductData(inquirer) {
    return inquirer
        .prompt([
            {
                type: 'input',
                name: 'productAdminUsername',
                message: `Provide a username`,
                default: 'admin',
                validate(answer) {
                    if (answer.length > 100) {
                        return `Valid name is up to 100 characters.`;
                    }
                    return true;
                },
            },
            {
                type: 'input',
                name: 'productAdminEmail',
                message: `Provide an Email`,
                mask: true,
                validate(answer) {
                    if (answer.toLowerCase()
                        .match(
                            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                        ) == null) {
                        return ` Email address not valid.`;
                    }
                    return true;
                },
            },
            {
                type: 'password',
                name: 'productAdminPassword',
                message: `Provide a password`,
                mask: true,
                validate(answer) {
                    if (answer.length > 100 || answer.length < 4) {
                        return `Valid password is up to 100 characters.`;
                    }
                    return true;
                },
            },
            {
                type: 'input',
                name: 'productLicenseKey',
                message: `Provide a license key (Optional)`,
            },
            {
                type: 'input',
                name: 'productDomain',
                message: `Provide domain (Optional). The product URL will be a subdomain of this domain. (e.g. bamboo.example.com)`,
            },
            {
                type: 'input',
                name: 'datasetURL',
                message: `Provide a dataset URL (Optional)`,
            },
            {
                type: 'input',
                name: 'productHelmChartVersion',
                message: `Provide a product helm chart version`,
                default: '1.0.0'
            },
            {
                type: 'input',
                name: 'productCPU',
                message: `Provide a product CPU capacity`,
                default: '1'
            },
            {
                type: 'input',
                name: 'productMemory',
                message: `Provide a product memory capacity`,
                default: '1Gi'
            },
            {
                type: 'input',
                name: 'productMinHeap',
                message: `Provide a minimum heap size`,
                default: '256m'
            },
            {
                type: 'input',
                name: 'productMaxHeap',
                message: `Provide a maximum heap size`,
                default: '512m'
            },
            {
                type: 'input',
                name: 'agentCPU',
                message: `Provide an agent CPU capacity`,
                default: '0.25'
            },
            {
                type: 'input',
                name: 'agentMemory',
                message: `Provide an agent memory capacity`,
                default: '256m'
            },
            {
                type: 'input',
                name: 'numOfAgents',
                message: `Provide number of agents`,
                default: 5
            },

        ])
}

async function askDBData(inquirer) {
    return inquirer
        .prompt([
            {
                type: 'autocomplete',
                name: 'dbInstanceClass',
                message: `Provide a database instance class`,
                default: "db.t3.micro",
                pageSize: 6,
                source: searchDBInstanceTypes
            },
            {
                type: 'input',
                name: 'dbAllocatedStorage',
                message: `Provide storage size in GB.`,
                default: 100,
            },
            {
                type: 'input',
                name: 'dbIops',
                message: `Provide database IOPS.`,
                default: 1000,
            },
        ])
}

function handleOptionalValue(config) {
    if (config.productLicenseKey == '') {
        config['licenseFlag'] = '#'
    } else {
        config['licenseFlag'] = ''
    }

    if (config.productAdminPassword == '') {
        config['passwrodFlag'] = '#'
    } else {
        config['passwrodFlag'] = ''
    }

    if (config.productDomain == '') {
        config['domainFlag'] = '#'
    } else {
        config['domainFlag'] = ''
    }

    if (config.datasetURL == '') {
        config['datasetURLFlag'] = '#'
    } else {
        config['datasetURLFlag'] = ''
    }
    return config
}

function runCofig(config) {
    const output = mustache.render(fs.readFileSync(path.join(__dirname, './config.tfvars.mustache')).toString(), config)
    fs.writeFileSync(`../${config.envName}.config.tfvars`, output)

    const spawnSync = require('child_process').spawnSync;
    spawnSync('../install.sh', ['-c', `../${config.envName}.config.tfvars`], { stdio: 'inherit', shell: true });
}

function searchInstanceTypes(answers, input) {
    input = input || '';
    return new Promise(function (resolve) {
        setTimeout(function () {
            var fuzzyResult = fuzzy.filter(input, awsInstances);
            resolve(
                fuzzyResult.map(function (el) {
                    return el.original;
                })
            );
        }, _.random(30, 500));
    });
}

function searchRegions(answers, input) {
    input = input || '';
    return new Promise(function (resolve) {
        setTimeout(function () {
            var fuzzyResult = fuzzy.filter(input, awsRegions);
            resolve(
                fuzzyResult.map(function (el) {
                    return el.original;
                })
            );
        }, _.random(30, 500));
    });
}

function searchDBInstanceTypes(answers, input) {
    input = input || '';
    return new Promise(function (resolve) {
        setTimeout(function () {
            var fuzzyResult = fuzzy.filter(input, awsDBInstances);
            resolve(
                fuzzyResult.map(function (el) {
                    return el.original;
                })
            );
        }, _.random(30, 500));
    });
}
