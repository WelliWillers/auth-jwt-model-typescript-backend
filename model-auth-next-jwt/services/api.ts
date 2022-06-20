import { rejects } from 'assert'
import axios, {AxiosError} from 'axios'
import { parseCookies, setCookie } from 'nookies'
import { signOut } from '../contexts/AuthContext'

let cookies = parseCookies()
let isRefreshing = false
let faildRequestsQueue = []

export const api = axios.create({
  baseURL: 'http://localhost:3333',
  headers: {
    Authorization: `Bearer ${cookies['auth.token']}`
  }
})

api.interceptors.response.use(response => {
  return response
}, (error: AxiosError) => {
  if(error.response.status === 401) {
    if(error.response.data?.code === "token.expired"){
      cookies = parseCookies()

      const { 'auth.refreshToken': refreshToken } = cookies

      const originalConfig = error.config

      if(!isRefreshing){
        isRefreshing = true

        api.post('/refresh', {
          refreshToken
        }).then((response) => {
          const { token, refreshToken } = response.data
  
          setCookie(undefined, 'auth.token', token, {
            maxAge: 60 * 60 * 24 * 30, // 30 dias,
            path: '/'
          })
  
          setCookie(undefined, 'auth.refreshToken', refreshToken, {
            maxAge: 60 * 60 * 24 * 30, // 30 dias,
            path: '/'
          })
  
          api.defaults.headers['Authorization'] = `Bearer ${token}`

          faildRequestsQueue.forEach(request => request.onSuccess(token))
          faildRequestsQueue = []

        }).catch((error: AxiosError) => {

          faildRequestsQueue.forEach(request => request.onFailure(error))
          faildRequestsQueue = []

        }).finally(() => {

          isRefreshing = false

        })

      }

      return new Promise((resolve, rejects) => {
        faildRequestsQueue.push({
          onSuccess: (token: string) => {
            originalConfig.headers['Authorization'] = `Bearer ${token}`

            resolve(api(originalConfig))
          },

          onFailure: (error: AxiosError) => {
            rejects(error)
          }
        })
      })
      
    } else {
      signOut()
    }
  }

  return Promise.reject(error)
})