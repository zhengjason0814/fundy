import AuthForm from '../components/AuthForm'

function Login() {
  return (
    <AuthForm
      title="Log in"
      endpoint="/auth/login"
      buttonLabel="Log in"
      footer={{ text: 'No account?', to: '/signup', linkLabel: 'Sign up' }}
    />
  )
}

export default Login
