import axios from "axios"
import { useState } from "react"
import { SERVER_URL } from "../../config/config"

export default function CSVUpload({
  onUploadSuccess,
  league,
}: {
  onUploadSuccess: () => void
  league: "NBA" | "NFL"
}) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setSuccess(null)

    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith(".csv")) {
      setError("Please upload a CSV file")
      return
    }

    setFile(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) {
      setError("No file selected")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      console.log(formData)
      console.log(file)

      const res = await axios.post(
        `${SERVER_URL}/admin/game/csvUpload${league}`,
        formData,
        {
          // 🚨 DO NOT set Content-Type manually
          // Axios will set multipart/form-data + boundary correctly
        }
      )

      if (res.status !== 200) {
        throw new Error(res.data.error || "Upload failed")
      }

      setSuccess(`Uploaded successfully (${res.data.insertedRows} rows)`)
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      onUploadSuccess()
      setFile(null)
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <h3>Upload Players CSV</h3>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        disabled={loading}
      />

      <div style={{ marginTop: 12 }}>
        <button onClick={handleUpload} disabled={!file || loading}>
          {loading ? "Uploading..." : "Upload CSV"}
        </button>
      </div>

      {file && (
        <p style={{ marginTop: 8 }}>
          Selected: <strong>{file.name}</strong>
        </p>
      )}

      {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}

      {success && <p style={{ color: "green", marginTop: 8 }}>{success}</p>}
    </div>
  )
}
