export default function respondError(res, error) {
  if (!error.status && error.code !== '23505') {
    console.error('Account request failed:', error.message);
  }
  const status = error.status || (error.code === '23505' ? 409 : 500);
  const message = error.status ? error.message
    : status === 409 ? 'Account already exists' : 'Internal server error';
  return res.status(status).json({ success: false, error: message });
}
