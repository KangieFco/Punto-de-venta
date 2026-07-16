import qz from 'qz-tray'
import client from '../api/client'

let connectionPromise: Promise<void> | null = null

type CertificateResolver = (
  certificate: string,
) => void

type CertificateRejecter = (
  error: unknown,
) => void

type SignatureResolver = (
  signature: string,
) => void

type SignatureRejecter = (
  error: unknown,
) => void

interface SignatureResponse {
  success: boolean
  data?: {
    signature: string
  }
  message?: string
}

qz.security.setCertificatePromise(
  (
    resolve: CertificateResolver,
    reject: CertificateRejecter,
  ): void => {
    client
      .get<string>('/qz/certificate', {
        responseType: 'text',
      })
      .then(response => {
        resolve(response.data)
      })
      .catch(error => {
        console.error(
          'No se pudo obtener el certificado de QZ:',
          error,
        )

        reject(error)
      })
  },
)

qz.security.setSignatureAlgorithm('SHA512')

qz.security.setSignaturePromise(
  (toSign: string) => {
    return (
      resolve: SignatureResolver,
      reject: SignatureRejecter,
    ): void => {
      client
        .post<SignatureResponse>(
          '/qz/sign',
          {
            request: toSign,
          },
        )
        .then(response => {
          const signature =
            response.data.data?.signature

          if (!signature) {
            throw new Error(
              'El backend no devolvió la firma de QZ.',
            )
          }

          resolve(signature)
        })
        .catch(error => {
          console.error(
            'No se pudo firmar la solicitud de QZ:',
            error,
          )

          reject(error)
        })
    }
  },
)

export async function connectQz(): Promise<void> {
  if (qz.websocket.isActive()) {
    return
  }

  if (!connectionPromise) {
    connectionPromise = qz.websocket
      .connect({
        retries: 3,
        delay: 1,
      })
      .then((): void => undefined)
      .finally((): void => {
        connectionPromise = null
      })
  }

  await connectionPromise
}

export async function disconnectQz(): Promise<void> {
  if (qz.websocket.isActive()) {
    await qz.websocket.disconnect()
  }
}