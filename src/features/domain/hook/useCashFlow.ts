import { useState, useEffect, useMemo, useCallback } from 'react';
import { type DateRange } from './useSalesReports';


export const useCashflow = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [range, setRange] = useState<DateRange>('today');

    const stats = useMemo(() => {
        return {}
    },[])

    return{
        isLoading,
        stats,
        range,
        setRange
    }
}