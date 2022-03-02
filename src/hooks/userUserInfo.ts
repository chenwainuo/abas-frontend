import useSWR from "swr";

export default function useUserInfo(publicKey) {
    // @ts-ignore
    const fetcher = (...args) => fetch(...args).then(res => res.json())

    const { data, error } = useSWR(`/api/info/${publicKey}`, fetcher)

    return {
        data: data,
        isLoading: !error && !data,
        isError: error
    }
}
