import React from 'react';
import Linkify from 'linkify-react';

const TextMessage = ({ message }) => {
    return (
        <div className="text-sm whitespace-pre-wrap break-words">
            <Linkify options={{ target: '_blank', className: 'text-blue-500 underline hover:text-blue-600' }}>
                {message.body}
            </Linkify>
        </div>
    );
};

export default TextMessage;
