import type { GetServerSideProps } from 'next'
import { FormEvent, useContext, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import styles from '../styles/Home.module.css'
import {parseCookies} from 'nookies'

export default function Home() {

  const { signIn } = useContext(AuthContext)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(event: FormEvent){
    event.preventDefault()

    try {
      const data = {
        email,
        password
      }

      await signIn(data)
    }catch(err) {
      console.log(err)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.container}>
      <input type="email" name="email" placeholder="Seu email" onChange={(e) => setEmail(e.target.value)} />
      <input type="password" name="password" placeholder="Sua senha" onChange={(e) => setPassword(e.target.value)} />

      <button type="submit">Entrar</button>
    </form>
  )
}


export const getServerSideProps: GetServerSideProps = async (ctx) => {

  const cookies = parseCookies(ctx)

  if(cookies['auth.token']){
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false
      }
    }
  }
  
  return {
    props: {

    }
  }
}