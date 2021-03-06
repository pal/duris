#!/usr/bin/env node

'use strict'

import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import stringify from 'safe-stable-stringify'

const importValueYamlType = new yaml.Type('!ImportValue', { kind: 'scalar' })
const refYamlType = new yaml.Type('!Ref', { kind: 'scalar' })
const joinYamlType = new yaml.Type('!Join', { kind: 'scalar' })
const schema = yaml.Schema.create([importValueYamlType, refYamlType, joinYamlType])

const objHasProp = (o, p) => {
  return (typeof o !== 'undefined') && (typeof p !== 'undefined') && (o !== null) && (p !== null) && Object.prototype.hasOwnProperty.call(o, p)
}

console.log('duris - simple docs for serverless projects')

const getAllYamlFilesFromFolder = (folder = '.', files = []) => {
  fs.readdirSync(folder).forEach(foundFile => {
    const filename = path.join(folder, foundFile)
    if (fs.statSync(filename).isDirectory() && foundFile !== 'node_modules') {
      return getAllYamlFilesFromFolder(filename, files)
    } else if (foundFile === 'serverless.yml') {
      return files.push(filename)
    } else {
      return files
    }
  })
  return files
}

const printProject = (project) => {
  console.log(`== ${project.service} ==`)
  if (objHasProp(project, 'functions')) {
    // console.log(`  * ${stringify(project.functions)}`)
    Object.keys(project.functions).forEach(func => {
      printFunction(project, func)
    })
    // console.log(JSON.stringify(Object.getOwnPropertyNames(project.functions), null, 2))
  }
}

const printFunction = (project, func) => {
  const formatEvent = (evt) => {
    if (objHasProp(evt, 'http')) {
      return `HTTP ${evt.http.path}`
    }
    if (objHasProp(evt, 'sqs')) {
      return 'SQS'
    }
    if (objHasProp(evt, 's3')) {
      return `S3 ${evt.s3.bucket}`
    }
    if (objHasProp(evt, 'eventBridge')) {
      // console.log(`evt == ${stringify(evt)}`)
      if (objHasProp(evt.eventBridge, 'pattern')) {
        return `EVENTBRIDGE '${evt.eventBridge.pattern['detail-type']}'`
      }
      return 'EVENTBRIDGE'
    }
    return `${stringify(evt)}`
  }

  console.log(`  * ${func}`)
  if (objHasProp(project.functions[func], 'events')) {
    Object.keys(project.functions[func].events).forEach(evt => {
      console.log(`    - ${formatEvent(project.functions[func].events[evt])}`)
    })
  }
}

const args = process.argv.slice(2)
if (typeof args[0] !== 'undefined') {
  const files = getAllYamlFilesFromFolder(args[0])
  files.forEach(file => {
    const fileContents = fs.readFileSync(file, 'utf8')
    const data = yaml.safeLoad(fileContents, { schema })
    printProject(data)
  })
  // console.log(JSON.stringify(files, null, 2))
} else {
  console.warn('Please specify a path to search.')
}
