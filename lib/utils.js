export function cn(...classes) {
  return classes.filter(Boolean).join(" ")
}

export function formatTime(seconds) {
  return seconds < 10 ? `0${seconds}` : `${seconds}`
}

export function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
  } else {
    // Fallback for older browsers
    const textArea = document.createElement("textarea")
    textArea.value = text
    textArea.style.position = "fixed"
    textArea.style.left = "-999999px"
    textArea.style.top = "-999999px"
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      document.execCommand("copy")
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }

    document.body.removeChild(textArea)
  }
}
