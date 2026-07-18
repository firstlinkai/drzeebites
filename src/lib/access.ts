import type { Access, Where } from 'payload'

/** Anyone, including anonymous visitors. */
export const anyone: Access = () => true

/** Logged-in admin users only (all users are admins in this app). */
export const adminsOnly: Access = ({ req }) => Boolean(req.user)

/** Admins see everything; anonymous readers only see published docs. */
export const publishedOrAdmin: Access = ({ req }) => {
  if (req.user) return true
  return {
    _status: {
      equals: 'published',
    },
  }
}

/** Admins see everything; anonymous readers only see active AND published products. */
export const activePublishedOrAdmin: Access = ({ req }) => {
  if (req.user) return true
  const where: Where = {
    and: [
      {
        _status: {
          equals: 'published',
        },
      },
      {
        active: {
          equals: true,
        },
      },
    ],
  }
  return where
}
