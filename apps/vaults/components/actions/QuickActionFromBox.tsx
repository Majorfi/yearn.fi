import React from 'react';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {formatAmount} from '@yearn-finance/web-lib/utils/format.number';
import {formatCounterValue} from '@yearn-finance/web-lib/utils/format.value';
import performBatchedUpdates from '@yearn-finance/web-lib/utils/performBatchedUpdates';
import {Dropdown} from '@common/components/TokenDropdown';
import {useWallet} from '@common/contexts/useWallet';
import {useBalance} from '@common/hooks/useBalance';
import {useTokenPrice} from '@common/hooks/useTokenPrice';
import {handleInputChange} from '@common/utils';

import type {ChangeEvent, ReactElement} from 'react';
import type {TDropdownOption, TNormalizedBN} from '@common/types/types';

export type TQuickActionFromBox = {
	isDepositing: boolean,
	amount: TNormalizedBN,
	selectedOptionFrom: TDropdownOption | undefined
	possibleOptionsFrom: TDropdownOption[],
	onSelectFrom: (option: TDropdownOption) => void
	onSetAmount: (amount: TNormalizedBN) => void
	onSetMaxAmount: () => void
}

export function	QuickActionFromBox({
	isDepositing,
	amount,
	selectedOptionFrom,
	possibleOptionsFrom,
	onSelectFrom,
	onSetAmount,
	onSetMaxAmount
}: TQuickActionFromBox): ReactElement {
	const {isActive} = useWeb3();
	const {balances} = useWallet();

	const selectedFromBalance = useBalance(toAddress(selectedOptionFrom?.value), balances);
	const selectedOptionFromPricePerToken = useTokenPrice(toAddress(selectedOptionFrom?.value));

	return (
		<section aria-label={'FROM'} className={'flex w-full flex-col space-x-0 md:flex-row md:space-x-4'}>
			<div className={'relative z-10 w-full space-y-2'}>
				<div className={'flex flex-row items-baseline justify-between'}>
					<label className={'text-base text-neutral-600'}>
						{isDepositing ? 'From wallet' : 'From vault'}
					</label>
					<legend className={'font-number inline text-xs text-neutral-600 md:hidden'} suppressHydrationWarning>
						{`You have ${formatAmount(selectedFromBalance.normalized)} ${selectedOptionFrom?.symbol || 'tokens'}`}
					</legend>
				</div>
				{(possibleOptionsFrom.length > 1) ? (
					<Dropdown
						defaultOption={possibleOptionsFrom[0]}
						options={possibleOptionsFrom}
						selected={selectedOptionFrom}
						balanceSource={balances}
						onSelect={(option: TDropdownOption): void => onSelectFrom(option)} />
				) : (
					<div className={'flex h-10 w-full items-center justify-between bg-neutral-0 px-2 text-base text-neutral-900 md:px-3'}>
						<div className={'relative flex flex-row items-center'}>
							<div key={selectedOptionFrom?.value} className={'h-6 w-6 rounded-full'}>
								{selectedOptionFrom?.icon}
							</div>
							<p className={'overflow-x-hidden text-ellipsis whitespace-nowrap pl-2 font-normal text-neutral-900 scrollbar-none'}>
								{selectedOptionFrom?.symbol}
							</p>
						</div>
					</div>
				)}
				<legend className={'font-number hidden text-xs text-neutral-600 md:inline'} suppressHydrationWarning>
					{`You have ${formatAmount(selectedFromBalance.normalized)} ${selectedOptionFrom?.symbol || 'tokens'}`}
				</legend>
			</div>
			<div className={'w-full space-y-2'}>
				<label
					htmlFor={'fromAmount'}
					className={'hidden text-base text-neutral-600 md:inline'}>
					{'Amount'}
				</label>
				<div className={'flex h-10 items-center bg-neutral-0 p-2'}>
					<div className={'flex h-10 w-full flex-row items-center justify-between py-4 px-0'}>
						<input
							id={'fromAmount'}
							className={`w-full overflow-x-scroll border-none bg-transparent py-4 px-0 font-bold outline-none scrollbar-none ${isActive ? '' : 'cursor-not-allowed'}`}
							type={'text'}
							disabled={!isActive}
							value={amount.normalized}
							onChange={(e: ChangeEvent<HTMLInputElement>): void => {
								performBatchedUpdates((): void => {
									onSetAmount(handleInputChange(e, balances?.[toAddress(selectedOptionFrom?.value)]?.decimals || 18));
								});
							}} />
						<button
							onClick={onSetMaxAmount}
							className={'ml-2 cursor-pointer bg-neutral-900 px-2 py-1 text-xs text-neutral-0 transition-colors hover:bg-neutral-700'}>
							{'Max'}
						</button>
					</div>
				</div>
				<legend className={'font-number mr-1 text-end text-xs text-neutral-600 md:mr-0 md:text-start'}>
					{formatCounterValue(amount?.normalized || 0, selectedOptionFromPricePerToken)}
				</legend>
			</div>
		</section>
	);
}
