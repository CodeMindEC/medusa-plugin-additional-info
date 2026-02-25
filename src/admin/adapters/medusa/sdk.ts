export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }
export type JsonObject = Record<string, JsonValue>

type QueryValue = string | number | boolean | null | undefined | string[] | number[] | boolean[]
export type QueryParams = Record<string, QueryValue>

function getBackendUrl() {
    const g = globalThis as typeof globalThis & { __BACKEND_URL__?: string }
    const env = (import.meta as { env?: { VITE_BACKEND_URL?: string } }).env
    return g.__BACKEND_URL__ ?? env?.VITE_BACKEND_URL ?? "/"
}

function serializeQuery(query?: QueryParams) {
    if (!query) return ""
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue
        if (Array.isArray(value)) {
            value.forEach((item, index) => {
                params.append(`${key}[${index}]`, String(item))
            })
            continue
        }
        params.append(key, String(value))
    }
    const qs = params.toString()
    return qs ? `?${qs}` : ""
}

function buildUrl(path: string, query?: QueryParams) {
    const base = getBackendUrl().replace(/\/$/, "")
    const url = path.startsWith("http")
        ? path
        : path.startsWith("/")
            ? `${base}${path}`
            : `${base}/${path}`
    const qs = serializeQuery(query)
    if (!qs) return url
    return url.includes("?") ? `${url}&${qs.slice(1)}` : `${url}${qs}`
}

async function request<T>(path: string, init: RequestInit, query?: QueryParams): Promise<T> {
    const response = await fetch(buildUrl(path, query), {
        ...init,
        credentials: "include",
    })

    const contentType = response.headers.get("content-type") ?? ""
    const isJson = contentType.includes("application/json")
    const payload = isJson ? await response.json() : await response.text()

    if (!response.ok) {
        const error = new Error(`Request failed with status ${response.status}`) as Error & {
            status?: number
            body?: JsonValue | string
        }
        error.status = response.status
        error.body = payload as JsonValue | string
        throw error
    }

    return payload as T
}

export async function adminGet<T = any>(path: string, query?: QueryParams): Promise<T> {
    return request<T>(path, {
        method: "GET",
        headers: { Accept: "application/json" },
    }, query)
}

export async function adminPost<T = any>(path: string, body: JsonValue): Promise<T> {
    return request<T>(path, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
    })
}

export async function adminDelete<T = any>(path: string): Promise<T> {
    return request<T>(path, {
        method: "DELETE",
        headers: { Accept: "application/json" },
    })
}

export async function adminUpdate<T = any>(path: string, body: JsonValue): Promise<T> {
    const tryRequest = async (method: "PATCH" | "POST") => {
        return request<T>(path, {
            method,
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(body),
        })
    }

    try {
        return await tryRequest("PATCH")
    } catch (error) {
        const status = (error as { status?: number } | null)?.status
        if (status === 404 || status === 405) {
            return await tryRequest("POST")
        }
        throw error
    }
}
