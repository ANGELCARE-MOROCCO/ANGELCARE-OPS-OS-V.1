export async function safeAction(
  action: () => Promise<any>,
  setLoading: (value: boolean) => void
) {
  try {
    setLoading(true)
    await action()
    alert('Success')
  } catch (error: any) {
    console.error(error)
    alert(error?.message || 'Action failed')
  } finally {
    setLoading(false)
  }
}