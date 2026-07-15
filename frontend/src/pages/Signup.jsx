import AuthForm from '../components/AuthForm'

function Signup() {
  return (
    <AuthForm
      title="Create your account"
      endpoint="/auth/signup"
      buttonLabel="Sign up"
      footer={{ text: 'Already have an account?', to: '/login', linkLabel: 'Log in' }}
    />
  )
}

export default Signup
