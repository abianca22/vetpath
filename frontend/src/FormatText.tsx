import React from "react";

export default function FormatText(props) {
    return <>
    {
        props.message.split('\n').map((row, index) =>
            <React.Fragment key={index}>
                {
                    row.split('**')
                        .map((sentence, ind) => {
                            if (index % 2 === 1) {
                                return <b key={ind}>{sentence}</b>;
                            }
                            return <span key={ind}>{sentence}</span>;
                        })
                }
                <br/>
                </React.Fragment>
        )
    }
    </>
}