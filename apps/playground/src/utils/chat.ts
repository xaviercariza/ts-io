// Create a key that is order-independent
const getChatKey = (senderId: string, receiverId: string) => {
  const participants = [senderId, receiverId].sort()
  return participants.join('_')
}

export { getChatKey }
