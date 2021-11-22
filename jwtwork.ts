import jwt from 'jsonwebtoken'
import config from './config'

const jwtwork = async (req: Express.Request) => {
  const userToken = req.session.userToken
  if (userToken) {
    try {
      const jwtData: any =
        jwt.verify(userToken, config.secret); const { userId } = jwtData;
      return { userId }
    } catch (err) {
      console.log('err', 'jwt not pass'); return { userId: null };      //if (throwError) throw new Error('Not authenticated')
    }
  } else { return { userId: null } }
}


export default jwtwork