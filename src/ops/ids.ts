const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz"

function randomString(len: number) {
    // Browser + Node (crypto)
    const g: any = globalThis as any
    const cryptoObj = g.crypto

    if (cryptoObj?.getRandomValues) {
        const arr = new Uint8Array(len)
        cryptoObj.getRandomValues(arr)
        let out = ""
        for (let i = 0; i < len; i++) {
            out += alphabet[arr[i] % alphabet.length]
        }
        return out
    }

    // Fallback (no crypto)
    let out = ""
    for (let i = 0; i < len; i++) {
        out += alphabet[Math.floor(Math.random() * alphabet.length)]
    }
    return out
}

/**
 * ID corto, estable y razonablemente único para nodos.
 * Recomendación: si luego quieres ULID real, reemplazas esta función internamente sin romper API.
 */
export function generateNodeId(prefix = "n") {
    const ts = Date.now().toString(36)
    return `${prefix}_${ts}_${randomString(10)}`
}
