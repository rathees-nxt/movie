const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'moviesData.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

//Get movie table
app.get('/movies/', async (request, response) => {
  const getMovieQuery = `SELECT movie_name FROM movie
  ORDER BY 
    movie_id`
  const movieArray = await db.all(getMovieQuery)
  const ans = dbObj => {
    return {
      movieName: dbObj.movie_name,
    }
  }
  const newMovieArray = movieArray.map(eachMovie => ans(eachMovie))
  response.send(newMovieArray)
})

//Add new movie in the movie table
app.post('/movies/', async (request, response) => {
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails
  const addMovieQuery = `insert into movie(director_id,movie_name,lead_actor)
  values(${directorId},'${movieName}','${leadActor}')`
  await db.run(addMovieQuery)
  response.send('Movie Successfully Added')
})

//Returns a movie based on the movie ID
app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const getSingleMovieQuery = `
  SELECT 
    * 
  FROM 
    movie
  WHERE
    movie_id = ${movieId};`
  const singleMovie = await db.get(getSingleMovieQuery)
  const ans = dbObj => {
    return {
      movieId: dbObj.movie_id,
      directorId: dbObj.director_id,
      movieName: dbObj.movie_name,
      leadActor: dbObj.lead_actor,
    }
  }
  const newSingleMovieId = ans(singleMovie)
  response.send(newSingleMovieId)
})

//Updates the details of a movie in the movie table
app.put('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const {directorId, movieName, leadActor} = request.body
  const updateMovieQuery = `
    UPDATE
      movie
    SET
      director_id=${directorId},
      movie_name='${movieName}',
      lead_actor='${leadActor}'
    WHERE
      movie_id=${movieId}`
  await db.run(updateMovieQuery)
  response.send('Movie Details Updated')
})

//Deletes a movie from the movie table based on the movie ID
app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const deleteMovie = `
  DELETE FROM 
    movie 
  WHERE 
    movie_id = ${movieId}`
  const dbResponse = await db.run(deleteMovie)
  response.send('Movie Removed')
})

//Returns a list of all directors in the director table
app.get('/directors/', async (request, response) => {
  const getdirectorQuery = `SELECT * FROM director
  ORDER BY 
    director_id`
  const directorArray = await db.all(getdirectorQuery)
  const ans = dbObj => {
    return {
      directorId: dbObj.director_id,
      directorName: dbObj.director_name,
    }
  }
  response.send(directorArray.map(director => ans(director)))
})

//Returns a list of all movie names directed by a specific director
app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const getdirectorQuery = `
  SELECT 
    movie_name
  FROM 
    movie
  WHERE 
    director_id = ${directorId}`
  const directorArray = await db.all(getdirectorQuery)
  response.send(directorArray.map(movie => ({movieName: movie.movie_name})))
})

module.exports = app
