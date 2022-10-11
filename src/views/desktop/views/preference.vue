<template>
    <div class="preference">
        <el-form label-width="120px">
            <el-form-item label="My Address">
                <el-tooltip
                    effect="dark"
                    content="Click to copy"
                    placement="top-start"
                >
                    <el-input
                        type="textarea"
                        readonly
                        autosize
                        resize="none"
                        @click="store.copyAddress"
                        :value="currentUser.address.toUpperCase()"
                    />
                </el-tooltip>
            </el-form-item>
            <el-form-item label="Export My ID">
                <el-button
                    type="success"
                    round
                    :icon="Download"
                    @click="exportID"
                    >Export</el-button
                >
            </el-form-item>
            <el-divider />
            <el-form-item>
                <el-button
                    type="danger"
                    round
                    :icon="SwitchButton"
                    @click="store.signOut"
                >
                    Sign out
                </el-button>
            </el-form-item>
        </el-form>
    </div>
</template>
<script lang="ts" setup>
import { useSessionStore } from '@/views/common/store'
import {
    ElButton,
    ElDivider,
    ElForm,
    ElFormItem,
    ElInput,
    ElMessageBox,
    ElTooltip,
} from 'element-plus'
import { verifyPassword } from '@/db/user/crypto'
import { notice } from '@/utils/notification'
import { exportKeyPair, stringify } from '@comoc-im/id'
import { download } from '@/utils/file'
import { Download, SwitchButton } from '@element-plus/icons-vue'

const store = useSessionStore()
const { currentUser } = store

async function exportID(): Promise<void> {
    if (!currentUser) {
        return
    }
    const { value: _password } = await ElMessageBox.prompt(
        'Enter password to export COMOC id file',
        'Password',
        { inputType: 'password' }
    )
    const password = _password ? _password.trim() : ''
    if (!password) {
        return
    }

    const passwordCorrect = await verifyPassword(
        password,
        currentUser.passwordHash
    )
    if (!passwordCorrect) {
        notice('error', 'password wrong')
        return
    }
    const exported = await exportKeyPair(currentUser)
    download(
        stringify(exported.exportPrivateKey, exported.exportPublicKey),
        `${currentUser.username}.id`
    )
}
</script>
<style lang="scss">
.preference {
    margin: 48px 16px;
}
</style>
