import * as React from 'react';
import * as util from '../../Utils/utilfunctions';
import { ImageField } from '../Features/Image/image';
import { Textfield } from '../Features/Text/textManager';
import { Inputfield } from '../Features/Input/inputManager';
import { IBitmapShape } from '../../../Interfaces/javainterfaces';
import {
    parseShapeParameters,
    parseTextParameters,
    parseClickEvent,
    parseTapEvent,
} from '../Features/Events/eventManager';
import { createVisuObject } from '../../Objectmanagement/objectManager';
import { useObserver, useLocalStore } from 'mobx-react-lite';
import { ErrorBoundary } from 'react-error-boundary';

type Props = {
    section: Element;
};

export const Bitmap: React.FunctionComponent<Props> = ({
    section,
}) => {
    // Parsing of the fixed parameters
    const bitmap: IBitmapShape = {
        // ICommonShape properties
        shape: 'bitmap',
        elementId: section.getElementsByTagName('elem-id')[0]
            .innerHTML,
        center: util.stringToArray(
            section.getElementsByTagName('center')[0].innerHTML,
        ),
        // The lineWidth is 0 in the xml if border width is 1 in the codesys dev env.
        // Otherwise lineWidth is equal to the target border width. Very strange.
        lineWidth:
            Number(
                section.getElementsByTagName('line-width')[0]
                    .innerHTML,
            ) === 0
                ? 1
                : Number(
                      section.getElementsByTagName('line-width')[0]
                          .innerHTML,
                  ),
        hasFrameColor: util.stringToBoolean(
            section.getElementsByTagName('has-frame-color')[0]
                .innerHTML,
        ),
        hasInsideColor: util.stringToBoolean(
            section.getElementsByTagName('has-inside-color')[0]
                .innerHTML,
        ),
        frameColor: util.rgbToHexString(
            section.getElementsByTagName('frame-color')[0].innerHTML,
        ),
        frameColorAlarm: util.rgbToHexString(
            section.getElementsByTagName('frame-color-alarm')[0]
                .innerHTML,
        ),
        fillColor: util.rgbToHexString(
            section.getElementsByTagName('fill-color')[0].innerHTML,
        ),
        fillColorAlarm: util.rgbToHexString(
            section.getElementsByTagName('fill-color-alarm')[0]
                .innerHTML,
        ),
        enableTextInput: util.stringToBoolean(
            section.getElementsByTagName('enable-text-input')[0]
                .innerHTML,
        ),
        hiddenInput: util.stringToBoolean(
            section.getElementsByTagName('hidden-input')[0].innerHTML,
        ),

        // ICommonShape optional properties
        tooltip:
            section.getElementsByTagName('tooltip').length > 0
                ? util.parseText(
                      section.getElementsByTagName('tooltip')[0]
                          .textContent,
                  )
                : '',
        accessLevels: section.getElementsByTagName('access-levels')
            .length
            ? util.parseAccessLevels(
                  section.getElementsByTagName('access-levels')[0]
                      .innerHTML,
              )
            : ['rw', 'rw', 'rw', 'rw', 'rw', 'rw', 'rw', 'rw'],

        // IBitmapShape properties
        fileName:
            section.getElementsByTagName('file-name').length > 0
                ? util.parseText(
                      section.getElementsByTagName('file-name')[0]
                          .innerHTML,
                  )
                : '',
        transparent: util.stringToBoolean(
            section.getElementsByTagName('transparent')[0].innerHTML,
        ),
        showFrame: util.stringToBoolean(
            section.getElementsByTagName('show-frame')[0].innerHTML,
        ),
        clipFrame: util.stringToBoolean(
            section.getElementsByTagName('clip-frame')[0].innerHTML,
        ),
        frameType: section.getElementsByTagName('frame-type')[0]
            .innerHTML,
        rect: util.stringToArray(
            section.getElementsByTagName('rect')[0].innerHTML,
        ),
    };

    // Parsing of observable events (like toggle color)
    const shapeParameters = parseShapeParameters(section);
    // Parsing of user events that causes a reaction like toggle or pop up input
    const onclick = parseClickEvent(section);
    const onmousedown = parseTapEvent(section, 'down');
    const onmouseup = parseTapEvent(section, 'up');

    // Parsing the inputfield and returning a jsx object if it exists
    let inputField: JSX.Element;
    if (section.getElementsByTagName('enable-text-input').length) {
        if (
            section.getElementsByTagName('enable-text-input')[0]
                .innerHTML === 'true'
        ) {
            inputField = <Inputfield section={section}></Inputfield>;
        } else {
            inputField = null;
        }
    } else {
        inputField = null;
    }

    // Parsing the imageField and returning a jsx object if it exists
    let imageField: JSX.Element;
    if (
        section.getElementsByTagName('file-name').length ||
        section.getElementsByTagName('expr-fill-color').length
    ) {
        imageField = (
            <ImageField
                section={section}
                inlineElement={false}
            ></ImageField>
        );
    } else {
        imageField = null;
    }

    // Parsing the textfields and returning a jsx object if it exists
    let textField: JSX.Element;
    if (section.getElementsByTagName('text-format').length) {
        const textParameters = parseTextParameters(section);
        textField = (
            <Textfield
                section={section}
                textParameters={textParameters}
                shapeParameters={shapeParameters}
            ></Textfield>
        );
    } else {
        textField = null;
    }

    // Convert object to an observable one
    const state = useLocalStore(() =>
        createVisuObject(bitmap, shapeParameters),
    );

    // Return of the react node
    return useObserver(() => (
        <div
            style={{
                cursor: 'auto',
                overflow: 'visible',
                pointerEvents: state.pointerEvents,
                visibility: state.visibility,
                position: 'absolute',
                left:
                    Math.min(
                        state.transformedCornerCoord.x1,
                        state.transformedCornerCoord.x2,
                    ) +
                    state.transformedStartCoord.left -
                    state.lineWidth,
                top:
                    Math.min(
                        state.transformedCornerCoord.y1,
                        state.transformedCornerCoord.y2,
                    ) +
                    state.transformedStartCoord.top -
                    state.lineWidth,
                width:
                    state.transformedSize.width +
                    2 * state.lineWidth,
                height:
                    state.transformedSize.height +
                    2 * state.lineWidth,
            }}
        >
            {state.readAccess ? (
                <ErrorBoundary fallback={<div>Oh no</div>}>
                    {inputField}
                    <svg
                        style={{ float: 'left' }}
                        width={
                            state.transformedSize.width *
                                (state.motionAbsScale /
                                    1000) +
                            2 * state.lineWidth
                        }
                        height={
                            state.transformedSize.height *
                                (state.motionAbsScale /
                                    1000) +
                            2 * state.lineWidth
                        }
                        overflow="visible"
                    >
                        <svg
                            onClick={
                                typeof onclick === 'undefined' ||
                                onclick === null
                                    ? null
                                    : state.writeAccess
                                    ? () => onclick()
                                    : null
                            }
                            onMouseDown={
                                typeof onmousedown === 'undefined' ||
                                onmousedown === null
                                    ? null
                                    : state.writeAccess
                                    ? () => onmousedown()
                                    : null
                            }
                            onMouseUp={
                                typeof onmouseup === 'undefined' ||
                                onmouseup === null
                                    ? null
                                    : state.writeAccess
                                    ? () => onmouseup()
                                    : null
                            }
                            onMouseLeave={
                                typeof onmouseup === 'undefined' ||
                                onmouseup === null
                                    ? null
                                    : state.writeAccess
                                    ? () => onmouseup()
                                    : null
                            } // We have to reset if somebody leaves the object with pressed key
                            cursor={
                                (typeof onclick !== 'undefined' &&
                                    onclick !== null) ||
                                (typeof onmousedown !== 'undefined' &&
                                    onmousedown !== null) ||
                                (typeof onmouseup !== 'undefined' &&
                                    onmouseup !== null)
                                    ? 'pointer'
                                    : null
                            }
                            width={
                                state.transformedSize.width +
                                2 * state.lineWidth
                            }
                            height={
                                state.transformedSize.height +
                                2 * state.lineWidth
                            }
                            overflow="visible"
                            transform={state.transform}
                        >
                            {typeof state.tooltip === 'undefined' ||
                            state.tooltip === null ||
                            state.tooltip === '' ? null : (
                                <title>{state.tooltip}</title>
                            )}
                            {imageField}
                            {state.hasFrameColor ? (
                                <rect
                                    width={
                                        state.transformedSize.width
                                    }
                                    height={
                                        state.transformedSize.height
                                    }
                                    x={state.lineWidth}
                                    y={state.lineWidth}
                                    fill="none"
                                    stroke={state.stroke}
                                    strokeWidth={state.strokeWidth}
                                    strokeDasharray={
                                        state.strokeDasharray
                                    }
                                ></rect>
                            ) : null}
                            {typeof imageField === 'undefined' ||
                            imageField === null ? (
                                <line
                                    x1={state.lineWidth}
                                    y1={state.lineWidth}
                                    x2={
                                        state.transformedSize.width +
                                        state.lineWidth
                                    }
                                    y2={
                                        state.transformedSize.height +
                                        state.lineWidth
                                    }
                                    stroke={state.stroke}
                                    strokeWidth={state.strokeWidth}
                                    strokeDasharray={
                                        state.strokeDashArray
                                    }
                                ></line>
                            ) : null}
                            {typeof imageField === 'undefined' ||
                            imageField === null ? (
                                <line
                                    x1={state.lineWidth}
                                    y1={
                                        state.transformedSize.height +
                                        state.lineWidth
                                    }
                                    x2={
                                        state.transformedSize.width +
                                        state.lineWidth
                                    }
                                    y2={state.lineWidth}
                                    stroke={state.stroke}
                                    strokeWidth={state.strokeWidth}
                                    strokeDasharray={
                                        state.strokeDashArray
                                    }
                                ></line>
                            ) : null}
                            {typeof textField === 'undefined' ||
                            textField === null ? null : (
                                <svg
                                    width={
                                        state.transformedSize.width
                                    }
                                    height={
                                        state.transformedSize.height
                                    }
                                    x={state.lineWidth}
                                    y={state.lineWidth}
                                    overflow="visible"
                                >
                                    {textField}
                                </svg>
                            )}
                        </svg>
                    </svg>
                </ErrorBoundary>
            ) : null}
        </div>
    ));
};
