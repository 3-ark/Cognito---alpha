import {
 TypedUseSelectorHook, useDispatch, useSelector 
} from 'react-redux';
import { AnyAction,ThunkDispatch } from '@reduxjs/toolkit';

import { State } from 'src/state/State';

export const useAppDispatch = useDispatch<ThunkDispatch<unknown, unknown, AnyAction>>;
export const useAppSelector: TypedUseSelectorHook<State> = useSelector;
