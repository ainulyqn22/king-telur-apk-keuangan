import { useEffect, useState } from 'react';
import { useMasterDataController } from '../controllers/useMasterDataController';

interface Props { showToast:(m:string,t:'success'|'error')=>void; onRefresh:()=>void; refreshKey:number; }
export default function MasterDataView({showToast,onRefresh,refreshKey}:Props){
  const controller=useMasterDataController(refreshKey);
  const[supplier,setSupplier]=useState(''); const[customer,setCustomer]=useState(''); const[category,setCategory]=useState('');
  useEffect(()=>{if(controller.error)showToast(controller.error,'error');},[controller.error,showToast]);
  const run=async(action:()=>Promise<void>,message:string)=>{try{await action();showToast(message,'success');onRefresh();}catch(error:unknown){showToast(error instanceof Error?error.message:'Database operation failed','error');}};
  return <div className="grid lg:grid-cols-3 gap-6">
    <Section title="Supplier"><Form value={supplier} setValue={setSupplier} onAdd={()=>{void run(()=>controller.addSupplier({name:supplier,address:'',phone:'',notes:''}),'Supplier ditambahkan');}}/>{controller.suppliers.map(v=><Row key={v.id} name={v.name} remove={()=>{void run(()=>controller.remove('suppliers',v.id),'Supplier dinonaktifkan');}}/>)}</Section>
    <Section title="Customer"><Form value={customer} setValue={setCustomer} onAdd={()=>{void run(()=>controller.addCustomer({name:customer,type:'Customer Langsung',address:'',phone:'',notes:''}),'Customer ditambahkan');}}/>{controller.customers.map(v=><Row key={v.id} name={v.name} remove={()=>{void run(()=>controller.remove('customers',v.id),'Customer dinonaktifkan');}}/>)}</Section>
    <Section title="Kategori Biaya"><Form value={category} setValue={setCategory} onAdd={()=>{void run(()=>controller.addCategory(category),'Kategori ditambahkan');}}/>{controller.categories.map(v=><Row key={v} name={v} remove={()=>{void run(()=>controller.removeCategory(v),'Kategori dinonaktifkan');}}/>)}</Section>
  </div>;
}
function Section({title,children}:{title:string;children:React.ReactNode}){return <div className="bg-white p-5 rounded-2xl border space-y-3"><h2 className="font-bold">{title}</h2>{children}</div>;}
function Form({value,setValue,onAdd}:{value:string;setValue:(v:string)=>void;onAdd:()=>void}){return <div className="flex gap-2"><input value={value} onChange={e=>setValue(e.target.value)} className="border rounded-lg px-3 py-2 min-w-0"/><button disabled={!value.trim()} onClick={onAdd} className="bg-indigo-600 text-white px-3 rounded-lg disabled:opacity-40">Tambah</button></div>;}
function Row({name,remove}:{name:string;remove:()=>void}){return <div className="flex justify-between border-t pt-2 text-sm"><span>{name}</span><button onClick={remove} className="text-rose-600">Nonaktifkan</button></div>;}
