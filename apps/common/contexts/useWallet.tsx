import React, {createContext, memo, useCallback, useContext, useMemo, useState} from 'react';
import {useUI} from '@yearn-finance/web-lib/contexts/useUI';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {useBalances} from '@yearn-finance/web-lib/hooks/useBalances';
import {useClientEffect} from '@yearn-finance/web-lib/hooks/useClientEffect';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {ETH_TOKEN_ADDRESS} from '@yearn-finance/web-lib/utils/constants';
import {getProvider} from '@yearn-finance/web-lib/utils/web3/providers';
import {useYearn} from '@common/contexts/useYearn';

import type {ReactElement} from 'react';
import type {TBalanceData, TUseBalancesTokens} from '@yearn-finance/web-lib/hooks/types';
import type {TDict} from '@yearn-finance/web-lib/utils/types';
import type {TYearnVault} from '@common/types/yearn';

export type	TWalletContext = {
	balances: TDict<TBalanceData>,
	cumulatedValueInVaults: number,
	useWalletNonce: number,
	isLoading: boolean,
	refresh: (tokenList?: TUseBalancesTokens[]) => Promise<TDict<TBalanceData>>,
}

const	defaultProps = {
	balances: {},
	cumulatedValueInVaults: 0,
	useWalletNonce: 0,
	isLoading: true,
	refresh: async (): Promise<TDict<TBalanceData>> => ({})
};


/* 🔵 - Yearn Finance **********************************************************
** This context controls most of the user's wallet data we may need to
** interact with our app, aka mostly the balances and the token prices.
******************************************************************************/
const	WalletContext = createContext<TWalletContext>(defaultProps);
export const WalletContextApp = memo(function WalletContextApp({children}: {children: ReactElement}): ReactElement {
	const	[nonce, set_nonce] = useState(0);
	const	{chainID, provider} = useWeb3();
	const	{vaults, isLoadingVaultList, prices} = useYearn();
	const	{onLoadStart, onLoadDone} = useUI();

	const	availableTokens = useMemo((): TUseBalancesTokens[] => {
		if (isLoadingVaultList) {
			return [];
		}
		const	tokens: TUseBalancesTokens[] = [];
		Object.values(vaults || {}).forEach((vault?: TYearnVault): void => {
			if (!vault) {
				return;
			}
			tokens.push({token: vault?.address});
			tokens.push({token: vault.token.address});
		});
		tokens.push({token: ETH_TOKEN_ADDRESS});
		return tokens;
	}, [vaults, isLoadingVaultList]);

	const	{data: balances, update, updateSome, isLoading} = useBalances({
		key: chainID,
		provider: provider || getProvider(1),
		tokens: availableTokens,
		prices
	});

	const	cumulatedValueInVaults = useMemo((): number => {
		if (isLoadingVaultList || isLoading) {
			return 0;
		}
		return (
			Object.entries(balances).reduce((acc, [token, balance]): number => {
				const	vault = vaults?.[toAddress(token)] ;
				if (vault) {
					acc += balance.normalizedValue;
				}
				return acc;
			}, 0)
		);
	}, [vaults, balances, isLoadingVaultList, isLoading]);

	const	onRefresh = useCallback(async (tokenToUpdate?: TUseBalancesTokens[]): Promise<TDict<TBalanceData>> => {
		if (tokenToUpdate) {
			const updatedBalances = await updateSome(tokenToUpdate);
			return updatedBalances;
		} 
		const updatedBalances = await update();
		return updatedBalances;
		
	}, [update, updateSome]);

	useClientEffect((): void => {
		if (isLoading) {
			if (!balances) {
				set_nonce(nonce + 1);
			}
			onLoadStart();
		} else {
			onLoadDone();
		}
	}, [isLoading]);

	/* 🔵 - Yearn Finance ******************************************************
	**	Setup and render the Context provider to use in the app.
	***************************************************************************/
	const	contextValue = useMemo((): TWalletContext => ({
		balances: balances,
		cumulatedValueInVaults,
		isLoading: isLoading || false,
		refresh: onRefresh,
		useWalletNonce: nonce
	}), [balances, cumulatedValueInVaults, isLoading, onRefresh, nonce]);

	return (
		<WalletContext.Provider value={contextValue}>
			{children}
		</WalletContext.Provider>
	);
});


export const useWallet = (): TWalletContext => useContext(WalletContext);
export default useWallet;
