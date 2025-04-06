import { useState } from 'react';

function useOrderCancellation() {
    const [isOrderCancelled, setIsOrderCancelled] = useState(false);

    const cancelOrder = () => setIsOrderCancelled(true);

    return { isOrderCancelled, cancelOrder };
}

export default useOrderCancellation;