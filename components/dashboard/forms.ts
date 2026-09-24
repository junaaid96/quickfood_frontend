/** Build multipart data so image uploads and plain fields go in one request. */
export function toFormData(values: Record<string, string | number | boolean | File | null | undefined>) {
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
        if (v === undefined) return;
        if (v === null) fd.append(k, "");
        else if (v instanceof File) fd.append(k, v);
        else fd.append(k, String(v));
    });
    return fd;
}
