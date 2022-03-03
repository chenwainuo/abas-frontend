import useSWR from "swr";
import {UserInfoData} from "../pages/api/info/[user]";

export type UserInfo = {
    data: UserInfoData,
    isLoading: boolean,
    isError: boolean
}

export default function useUserInfo(publicKey): UserInfo {
    // @ts-ignore
    const fetcher = (...args) => fetch(...args).then(res => res.json())

    const { data, error } = useSWR(`/api/info/${publicKey}`, fetcher, {refreshInterval: 30000})

    return {
        data: data,
        isLoading: !error && !data,
        isError: error
    }
}
