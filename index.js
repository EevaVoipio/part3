require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

const app = express()

app.use(express.json())
app.use(express.static('build'))

app.use(cors())

morgan.token('postPerson', function (req) {
  return JSON.stringify(req.body)
})

morgan.format(
  'person',
  ':method :url :status :res[content-length] - :response-time ms :postPerson'
)

app.use(
  morgan('person', {
    skip: function (req) {
      return req.method !== 'POST'
    },
  })
)

app.use(
  morgan('tiny', {
    skip: function (req) {
      return req.method === 'POST'
    },
  })
)

app.get('/info', (request) => {
  request.send(
    '<p>Phonebook has info for ' +
      Person.length +
      ' people</p>' +
      '<p>' +
      new Date() +
      '</p>'
  )
})

app.get('/api/persons', (request, response, next) => {
  Person.find({})
    .then((result) => {
      return response.json(result)
    })
    .catch((error) => next(error))
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then((person) => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch((error) => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(response.status(204).end())
    .catch((error) => next(error))
})

app.post('/api/persons', (request, response, next) => {
  const body = request.body

  if (!body.name) {
    return response.status(400).json({
      error: 'name missing',
    })
  }
  if (!body.number) {
    return response.status(400).json({
      error: 'number missing',
    })
  }

  const name = body.name
  const number = body.number
  const person = new Person({
    name: name,
    number: number,
  })

  person
    .save()
    .then((savedPerson) => {
      return savedPerson.toJSON()
    })
    .then((savedAndFormattedPerson) => {
      response.json(savedAndFormattedPerson)
    })
    .catch((error) => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body

  const person = {
    name: body.name,
    number: body.number,
  }

  Person.findByIdAndUpdate(request.params.id, person, { new: true })
    .then((updatedPerson) => {
      return updatedPerson.toJSON()
    })
    .then((savedAndFormattedPerson) => {
      response.json(savedAndFormattedPerson)
    })
    .catch((error) => next(error))
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)
  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)
// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
