import { useState } from 'react';

function useClientCancellation() {
    const [isCancelled, setIsCancelled] = useState(false);

    const cancel = () => setIsCancelled(true);

    return { isCancelled, cancel };
}

export default useClientCancellation;